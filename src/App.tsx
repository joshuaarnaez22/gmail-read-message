import React, { useState, useEffect } from "react";
import "./App.css";
interface Message {
  email: string;
  token: string;
  fullMessages: FullMessage[];
}

interface FullMessage {
  id: string;
  content: string;
  date: string;
  receiver: string;
  sender: string;
  subject: string;
}
function App() {
  const [messages, setMessages] = useState<Message>();
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const signInHandler = async () => {
    try {
      const response = await fetch("http://localhost:3001/auth");
      const url = await response.text();
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  const signOutHandler = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/signout?token=${messages?.token}`,
        { method: "POST" }
      );
      if (response.status === 200)
        window.location.href = "http://localhost:3000";
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get("code");
    if (code) {
      (async () => {
        try {
          setLoading(true);
          const res = await fetch(
            `http://localhost:3001/callback?code=${code}`
          );
          const message = await res.json();
          setLoading(false);
          setMessages(message);
          setAuth(true);
        } catch (error) {
          // window.location.href = "http://localhost:3000";
          window.alert(
            "NOTE! Need to implement refresh token logic need more research."
          );
          console.log(error);
        }
      })();
    }
  }, []);

  //should add a custom loader
  if (loading)
    return (
      <>
        <p>Loading messages...</p>
      </>
    );

  return (
    <div className="App">
      <p>
        Note!! this app does not save token yet so refresh is redirected to sign
        in
      </p>
      <main>
        {!auth ? (
          <button onClick={signInHandler}>Login with Google</button>
        ) : (
          <button onClick={signOutHandler}>SignOut</button>
        )}
      </main>

      <section>
        {messages &&
          messages.fullMessages.map((message) => <Card {...message} />)}
      </section>
    </div>
  );
}

//should be put in a component folder to be reused
const Card = ({
  id,
  subject,
  date,
  sender,
  receiver,
  content,
}: FullMessage) => {
  return (
    <div className="card" key={id}>
      <div className="card-header">
        <div className="card-title">{subject}</div>
        <div className="card-date">{date}</div>
      </div>
      <div className="card-body">
        <div className="card-sender">From: {sender}</div>
        <div className="card-receiver">To: {receiver}</div>
        <div className="card-content">{content}</div>
      </div>
    </div>
  );
};
export default App;
