package response

import "net/http"

type Response struct {
	StatusCode int         `json:"status_code"`
	Message    string      `json:"message,omitempty"`
	Body       interface{} `json:"body,omitempty"`
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
