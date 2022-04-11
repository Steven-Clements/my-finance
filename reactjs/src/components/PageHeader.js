// ${ Import Dependencies }
import React from 'react'

// ${ Create the Component }
const PageHeader = ({ cTitle, cText, cPath, cLinkText }) => {
  // < Return JSX Markup />
  return (
    <>
      <h2>{cTitle}</h2>
      <p>{cText}<a href={cPath}>{cLinkText}</a></p>
    </>
  )
}

// ${ Export the Component }
export default PageHeader
