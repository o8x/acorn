package ssh

type Connections struct {
	connections []*Connection
}

func (r *Connections) Add(c *Connection) {
	r.connections = append(r.connections, c)
}

func (r *Connections) Get(conn Connection) *Connection {
	for _, c := range r.connections {
		if conn.User == c.User && conn.Password == c.Password &&
			conn.Host == c.Host && conn.Port == c.Port &&
			conn.AuthMethod == c.AuthMethod {
			return c
		}
	}

	return nil
}

func (r *Connections) Remove(conn Connection) {
	i := 0
	conns := r.connections
	for _, c := range conns {
		if conn.User == c.User && conn.Password == c.Password &&
			conn.Host == c.Host && conn.Port == c.Port &&
			conn.AuthMethod == c.AuthMethod {
			conns[i] = c
			i++
		}
	}

	r.connections = conns[:i]
}
