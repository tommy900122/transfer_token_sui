import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { router } from './src/router'

const isdevelopment = process.env.NODE_ENV !== "production"
const port = process.env.PORT || 3000

const app = new Elysia()

if (isdevelopment) {
    app.use(swagger())
}

router(app)

app.listen(port)

console.log(`Listening on http://localhost:${port} ...`);