// ${ Import Dependencies }
import React from 'react'

// ${ Import Components }
import MenuHeading from './MenuHeading';
import Menu from '../components/Menu';

// ${ Create the Component }
const Navbar = () => {
  // < Return JSX Markup />
  return (
    <header id='site-header'>
      <MenuHeading />
      <Menu />
    </header>
  )
}

// ${ Export the Component }
export default Navbar
