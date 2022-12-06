package menu

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/o8x/acorn/backend/model"
	"github.com/o8x/acorn/backend/service"
	"github.com/o8x/acorn/backend/utils"
)

func NewSessionMenu(ctx context.Context, s *service.SessionService) (*menu.MenuItem, func()) {
	m := New("Session")
	fn := func() {
		defer runtime.MenuUpdateApplicationMenu(ctx)

		m.Reset()
		sessions := model.GetSessions()
		// 常用会话
		for i, sess := range sessions[:10] {
			func(conn *model.Sess) {
				m.Add(fmt.Sprintf("%2d. %s", i+1, conn.Label), func(data *menu.CallbackData) {
					resp := s.OpenSSHSession(conn.ID, "")
					if msg, ok := resp.IsError(); ok {
						utils.Message(ctx, fmt.Sprintf("会话打开失败: %s", msg))
					}
				})
			}(sess)
		}

		m.AddSeparator()
		m.AddText(fmt.Sprintf("Sessions Sum Count: %d", len(sessions)))

		for _, tag := range model.GetTags() {
			var subList []*model.Sess
			for _, sess := range sessions {
				if sess.InTag(tag.ID) {
					subList = append(subList, sess)
				}
			}

			// 避免出现空的列表
			if subList != nil {
				subTag := m.AddSubmenu(tag.Name)
				for _, sess := range subList {
					func(ss *model.Sess) {
						subTag.AddText(ss.Label, nil, func(data *menu.CallbackData) {
							resp := s.OpenSSHSession(ss.ID, "")
							if msg, ok := resp.IsError(); ok {
								utils.Message(ctx, fmt.Sprintf("会话打开失败: %ss", msg))
							}
						})
					}(sess)
				}
			}
		}
	}

	fn()
	return m.Build(), fn
}
