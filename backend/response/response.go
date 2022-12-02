package response

import "net/http"

type Response struct {
	StatusCode int         `json:"status_code"`
	Message    string      `json:"message,omitempty"`
	Body       interface{} `json:"body,omitempty"`
}

func (r Response) IsError() (string, bool) {
	if r.StatusCode == http.StatusInternalServerError {
		return r.Message, true
	}
	return "", false
}

func (r Response) IsNormal() bool {
	return r.StatusCode <= http.StatusNoContent
}

func OK(body interface{}) *Response {
	return &Response{
		StatusCode: http.StatusOK,
		Body:       body,
	}
}

func NoContent() *Response {
	return &Response{
		StatusCode: http.StatusNoContent,
	}
}

func Warn(msg string) *Response {
	return &Response{
		StatusCode: http.StatusInternalServerError,
		Message:    msg,
	}
}

func BadRequest() *Response {
	return &Response{
		StatusCode: http.StatusBadRequest,
	}
}

func Error(err error) *Response {
	return Warn(err.Error())
}
