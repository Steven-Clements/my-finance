// ${ Import Dependencies }
import React from 'react';

// ${ Import Components }
import MenuLink from './MenuLink';

// ${ Create the Component }
const Menu = () => {
  // < Return JSX Markup />
  return (
    <nav className="site-menu">
      <ul>
        <MenuLink cPath='/' cText='Accounts' />
        <MenuLink cPath='/reports' cText='Reports' />
        <MenuLink cPath='/settings' cText='Settings' />
      </ul>
    </nav>
  )
}

// ${ Export the Component }
export default Menu;