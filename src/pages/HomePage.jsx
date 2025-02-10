//HomePage.jsx
import Counter from '../components/Counter'
import TodoList from '../components/TodoList'
import UserProfile from '../components/UserProfile'
export default function HomePage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Ana Sayfa</h1>
            <p className="text-gray-600 mt-4">Bu bir test ana sayfasıdır.</p>
            <Counter />
            <TodoList />
            <UserProfile />
        </div>
    )
}

