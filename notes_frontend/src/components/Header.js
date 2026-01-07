import React from "react";

// PUBLIC_INTERFACE
function Header() {
  return (
    <header className="appHeader">
      <div className="container">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            N
          </div>
          <div>
            <h1 className="appTitle">Notes</h1>
            <p className="appSubtitle">Create, edit, and keep track of quick notes.</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
