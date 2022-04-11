// ${ Import Dependencies }
import React from 'react';
import { Link } from 'react-router-dom';

// ${ Create the Component }
const MenuHeading = () => {
  // < Return JSX Markup />
  return (
    <>
      <Link to="/"><div id="brand-logo"></div></Link>
      <Link to="/"><h1>My-Finance</h1></Link>
    </>
  )
}

// ${ Export the Component }
export default MenuHeading;