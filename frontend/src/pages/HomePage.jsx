import { v4 as uuidv4 } from "uuid"
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()
    const [roomId, setRoomId] = useState('')
    const [username, setUsername] = useState('')

    const createNewRoom = (e) => {
        e.preventDefault()
        const id = uuidv4()
        setRoomId(id)
        toast.success('Created a new room')
    }

    const joinRoom = (e) => {
        // Prevent form submission if triggered by button click inside form
        if (e) e.preventDefault();
        
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required')
            return
        }

        localStorage.setItem('username', username)

        navigate(`/editor/${roomId}`, {
            state: { username },
        })
    }

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom()
        }
    }

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <div className="homePageHeader">
                    <div className="logo-container">
                        <span className="logo-bracket">&lt;</span>
                        <span className="logo-text">Code<span className="logo-highlight">Together</span></span>
                        <span className="logo-bracket">&gt;</span>
                    </div>
                </div>
                
                <h4 className='mainLabel'>Paste Invitation ROOM ID</h4>
                
                <form className='loginForm' onSubmit={joinRoom}>
                    <div className="inputGroup">
                        <input 
                            type="text" 
                            className='inputBox' 
                            value={roomId} 
                            onKeyUp={handleInputEnter} 
                            onChange={(e) => setRoomId(e.target.value)} 
                            placeholder='ROOM ID'
                        />
                        <input 
                            type='text' 
                            className='inputBox' 
                            value={username} 
                            onKeyUp={handleInputEnter} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder='USERNAME'
                        />
                    </div>
                    
                    <button type='submit' className='btn joinBtn'>Join Now</button>
                    
                    <span className='createInfo'>
                        Don't have an invite? &nbsp;
                        <button 
                            type="button" 
                            className='createNewBtn' 
                            onClick={createNewRoom}
                        >
                            Create New Room
                        </button>
                    </span>
                </form>
            </div>

            <footer className="homeFooter">
                <h4>
                    Built with Passion by &nbsp;
                    <a href="https://github.com/rrao2521" target="_blank" rel="noreferrer">
                        rrao2521
                    </a>
                </h4>
            </footer>
        </div>
    )
}

export default Home