import { Show, UserButton } from '@clerk/react'
import { Link } from 'react-router-dom'
import Profile from '../components/Profile'

export default function Home() {
  return (
    <div>
        <h1 className="text-amber-900">Home</h1>
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
        <Profile />
    </div>
  )
}
