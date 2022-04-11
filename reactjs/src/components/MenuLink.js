// ${ Import Dependencies }
import React from 'react';
import { Link } from 'react-router-dom';

// ${ Create the Component }
const MenuLink = ({ cPath, cText }) => {
  // < Return JSX Markup />
  return (
    <Link to={cPath}><li>{cText}</li></Link>
  )
}

// ${ Export the Component }
export default MenuLink;