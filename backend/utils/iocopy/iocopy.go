package iocopy

import (
	"context"
	"io"
	"io/fs"
	"sync/atomic"
	"time"

	"github.com/o8x/acorn/backend/utils"
)

type Func func(Transfer)

type Size int64

func (s Size) String() string {
	return utils.SizeBeautify(int64(s), 2)
}

type Transfer struct {
	Process   float64       `json:"process"`
	Speed     Size          `json:"speed"`
	AvgSpeed  Size          `json:"avg_speed"`
	Size      Size          `json:"size"`
	Received  Size          `json:"received"`
	StartTime time.Time     `json:"start_time"`
	EndTime   time.Time     `json:"end_time"`
	TimeTotal time.Duration `json:"time_total"`
	TimeSpent time.Duration `json:"time_spent"`
	TimeLeft  time.Duration `json:"time_left"`
}

type IOCopy struct {
	src         fs.File
	dst         fs.File
	ctx         context.Context
	processFunc Func
}

func New(src fs.File, dst fs.File) *IOCopy {
	return &IOCopy{
		src:         src,
		dst:         dst,
		ctx:         context.Background(),
		processFunc: func(Transfer) {},
	}
}

func (i *IOCopy) ProcessBar(fn Func) {
	i.processFunc = fn
}

func (i *IOCopy) Start() error {
	var (
		size         int64 = 0
		received     int64 = 0
		unitReceived int64 = 0
		interval           = time.Second
	)

	stat, err := i.src.Stat()
	if err != nil {
		return err
	}
	size = stat.Size()

	startTs := time.Now()
	ctx, cancel := context.WithCancel(context.Background())

	// 0 -> 100M
	if size/1000000 <= 50 {
		interval = time.Millisecond * 1500
		// 50M -> 200M
	} else if size/1000000 > 50 && size/1000000 <= 200 {
		interval = time.Second * 5
		// 200M -> 2G
	} else if size/1000000 > 200 && size/1000000 <= 2000 {
		interval = time.Second * 30
	} else {
		interval = time.Minute
	}

	t := time.NewTicker(interval)
	go func(ctx2 context.Context) {
		for {
			select {
			case <-t.C:
				val := atomic.LoadInt64(&unitReceived)
				atomic.StoreInt64(&unitReceived, 0)
				atomic.AddInt64(&received, val)

				// 当前下载时间 / 当前百分比 = 1% 平均时间
				// 当前下载总数/总数 = 当前百分比
				// (100 - 当前百分比) * 1% 平均时间 = 预计剩余时间

				process := float64(received) / float64(size) * 100
				timeSpent := time.Since(startTs).Round(time.Second)
				unitAvgTime := timeSpent.Seconds() / process
				timeLeft := time.Duration((100-process)*unitAvgTime) * time.Second

				i.processFunc(Transfer{
					Process:   process,
					Speed:     Size(val / int64(interval)),
					AvgSpeed:  Size(received / int64(timeSpent.Seconds())),
					Size:      Size(size),
					Received:  Size(received),
					StartTime: startTs,
					TimeTotal: time.Duration(timeSpent.Seconds()+timeLeft.Seconds()) * time.Second,
					TimeSpent: timeSpent,
					TimeLeft:  timeLeft,
				})
			case <-ctx2.Done():
				t.Stop()

				var avgSpeed float64
				if time.Since(startTs).Seconds() != 0 {
					avgSpeed = float64(received) / time.Since(startTs).Seconds()
				}

				i.processFunc(Transfer{
					Process:   100,
					TimeTotal: time.Since(startTs).Round(time.Second),
					AvgSpeed:  Size(avgSpeed),
					Size:      Size(size),
					EndTime:   time.Now(),
				})
				return
			}
		}
	}(ctx)

	defer i.src.Close()
	defer i.dst.Close()
	defer cancel()
	for {
		buf := make([]byte, 32*1024)
		nr, err := i.src.Read(buf)
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}

		if nr > 0 {
			var nw int
			if w, ok := i.dst.(io.Writer); ok {
				nw, err = w.Write(buf[:nr])
			}

			if err != nil {
				if err == io.EOF {
					return nil
				}
				return err
			}

			atomic.AddInt64(&unitReceived, int64(nw))
		}
	}
	return nil
}
