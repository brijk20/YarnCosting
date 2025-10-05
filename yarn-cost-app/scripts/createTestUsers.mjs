#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  console.error('Missing VITE_SUPABASE_URL (or SUPABASE_URL) environment variable.')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Obtain it from the Supabase dashboard (Settings → API) and pass it in when running this script.')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const seedUsers = [
  {
    email: 'admin@ambrox.in',
    password: 'Admin@123',
    role: 'super_admin',
  },
  {
    email: 'user@ambrox.in',
    password: 'User@123',
    role: 'standard_user',
  },
]

async function run() {
  for (const user of seedUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role },
    })

    if (error) {
      if (error.message?.includes('already registered')) {
        console.log(`User ${user.email} already exists. Skipping.`)
      } else {
        console.error(`Failed to create ${user.email}:`, error.message)
        process.exitCode = 1
      }
    } else {
      console.log(`Created user ${user.email} (id: ${data.user?.id ?? 'unknown'})`)
    }
  }
}

run().catch((error) => {
  console.error('Unexpected error seeding users:', error)
  process.exit(1)
})
