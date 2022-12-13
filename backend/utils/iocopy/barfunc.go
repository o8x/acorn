package iocopy

import (
	"fmt"

	"github.com/o8x/acorn/backend/runner/logger"
)

func DefaultProcessBar(logger *logger.Logger) func(process Transfer) {
	logger.Write("  Total     %%   Received    Average  Time  Time  Time    Current")
	logger.Write("                               Speed Total Spent  Left      Speed")

	return func(process Transfer) {
		if process.Process == 100 {
			logger.Write(
				"%8s 100%% %10s %10s %5s %5s %5s %10s",
				process.Size.String(), process.Size.String(), process.AvgSpeed.String(), process.TimeTotal, process.TimeSpent, fmt.Sprintf("0s"), fmt.Sprintf("0KB"),
			)
			return
		}

		logger.Write(
			"%8s %3.0f%% %10s %10s %5s %5s %5s %10s",
			process.Size.String(), process.Process, process.Received.String(), process.AvgSpeed.String(), process.TimeTotal, process.TimeSpent, process.TimeLeft, process.Speed,
		)
	}
}
