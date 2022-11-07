package stringbuilder

import (
	"fmt"
	"strings"
)

type Builder struct {
	*strings.Builder
	queue []string
}

func (b *Builder) WriteString(s string) {
	b.queue = append(b.queue, s)
}

func (b *Builder) WriteStringf(format string, a ...any) {
	s := fmt.Sprintf(format, a...)
	b.queue = append(b.queue, s)
}

func (b *Builder) WriteSpace() {
	b.WriteString(" ")
}

func (b *Builder) WriteNewLine() {
	b.WriteString("\n")
}

func (b *Builder) WriteNEString(s string) {
	if s != "" {
		b.WriteString(s)
	}
}

func (b *Builder) WriteNEStringf(format string, a ...any) {
	s := fmt.Sprintf(format, a...)
	if s != "" {
		b.WriteStringf(s)
	}
}

func (b *Builder) WriteStringConditionf(condition string, format string, a ...any) {
	if condition != "" {
		b.WriteStringf(fmt.Sprintf(format, a))
	}
}

func (b *Builder) WriteStringFunc(fn func(*Builder)) {
	fn(b)
}

func (b *Builder) Join(sep string) string {
	return strings.Join(b.queue, sep)
}

func (b *Builder) Bytes() []byte {
	return []byte(b.String())
}

func (b *Builder) String() string {
	return b.Join("")
}
