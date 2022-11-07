package ssh

import (
	"fmt"
	"strings"
	"sync"
)

type Connections struct {
	connections sync.Map
}

func makeKey(c *SSH) string {
	builder := strings.Builder{}
	builder.WriteString(fmt.Sprintf("user:%s", c.Config.Username))
	builder.WriteString(fmt.Sprintf("password:%s", c.Config.Password))
	builder.WriteString(fmt.Sprintf("host:%s:%d", c.Config.Host, c.Config.Port))
	builder.WriteString(fmt.Sprintf("authtype:%s", c.Config.AuthType))
	builder.WriteString(fmt.Sprintf("proxyserver:%d", c.Config.ProxyServerID))

	return builder.String()
}

func (r *Connections) Add(c *SSH) {
	r.connections.Store(makeKey(c), c)
}

func (r *Connections) Get(conn *SSH) *SSH {
	load, ok := r.connections.Load(makeKey(conn))
	if ok {
		return load.(*SSH)
	}

	return nil
}

func (r *Connections) Remove(conn *SSH) {
	r.connections.Delete(makeKey(conn))
}
