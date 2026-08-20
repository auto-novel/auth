package infra

import (
	"context"
	"log/slog"
	"time"

	"github.com/mailgun/mailgun-go/v5"
)

type EmailClient interface {
	SendEmail(to string, title string, content string) error
}

type emailClient struct {
	mg     *mailgun.Client
	domain string
}

func NewEmailClient(domain string, apiKey string) EmailClient {
	mg := mailgun.NewMailgun(apiKey)
	mg.SetAPIBase(mailgun.APIBaseEU)
	return &emailClient{
		mg:     mg,
		domain: domain,
	}
}

func (c *emailClient) SendEmail(to string, title string, content string) error {
	from := "轻小说机翻机器人 <no-reply@" + c.domain + ">"
	message := mailgun.NewMessage(c.domain, from, title, content, to)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	_, err := c.mg.Send(ctx, message)
	if err != nil {
		slog.Error("Failed to send email", "error", err)
		return err
	}
	return nil
}
