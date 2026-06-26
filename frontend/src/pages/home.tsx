import { Show, UserButton } from '@clerk/react'
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
        <h1>Home</h1>
        <Show when="signed-out">
            <Link to="/login">
                LogIn
            </Link>
            <Link to="/signup">
                SignUp
            </Link>
        </Show>
        <Show when="signed-in">
            <UserButton/>
        </Show>
    </div>
  )
}
