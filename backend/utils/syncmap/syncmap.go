package syncmap

import "sync"

type Map[T any] struct {
	m *sync.Map
}

func New[T any]() *Map[T] {
	return &Map[T]{
		m: &sync.Map{},
	}
}

func (r *Map[T]) Store(name string, value T) {
	r.m.Store(name, value)
}

func (r *Map[T]) Load(name string) (v T) {
	load, ok := r.m.Load(name)
	if ok {
		v = load.(T)
	}
	return
}

func (r *Map[T]) Exist(name string) bool {
	_, ok := r.m.Load(name)
	return ok
}
