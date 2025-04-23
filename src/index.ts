import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'

const app = new Hono()
app.use(compress(), etag(), logger())
app.use('*', requestId())

// TODO: add specific origin to allow
app.use(
  '*',
  cors({
    origin: "*",
  })
)

app.get('/healthz', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
}
