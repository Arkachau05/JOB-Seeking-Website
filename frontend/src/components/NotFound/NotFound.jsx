import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <>
        <section className='page notfound'>
          <div className="cente">
            <img  class="Errorph"src="Error 404.png" alt="notfound"/>
            <div class="center">
            <Link class="button-35" to={'/'}>RETURN TO HOME PAGE</Link>
            </div>
          </div>
        </section>
    </>
  )
}

export default NotFound
