// ${ Import Components }
import PageHeader from "../components/PageHeader";

// ${ Create the Screen }
function Dashboard() {
  // < Return JSX Markup />
  return (
    <main id='dashboard' className='container'>
      <PageHeader
        cTitle='My Accounts'
        cText='You have not created any accounts yet... '
        cPath='/accounts/new'
        cLinkText='Create a New Account Here'
      />
    </main>
  );
}

// ${ Export the Screen }
export default Dashboard;