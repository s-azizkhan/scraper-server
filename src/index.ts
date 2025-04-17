import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'

const app = new Hono()
app.use(etag(), logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default {
  port: 3000,
  fetch: app.fetch,
}
