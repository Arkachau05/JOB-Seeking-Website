import { useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";

const welcomeMessage = {
  role: "assistant",
  text: "Hi! I’m the LookJobber demo assistant. Ask me about finding jobs, applications, resumes, or salaries.",
};

const getAssistantReply = (question) => {
  const text = question.toLowerCase();

  if (/\b(apply|application|applications)\b/.test(text)) {
    return "To apply to a live role, open its details and choose Apply for this role after signing in as a Job Seeker. The current sample listings are for browsing only, so applications are not enabled for them.";
  }
  if (/\b(job|jobs|role|roles|opening|openings|opportunit)/.test(text)) {
    return "You can browse the five sample openings on the Explore jobs page. Use each listing’s details to review its location, category, description, and sample salary. These are demo listings and can be replaced with your own jobs.";
  }
  if (/\b(resume|cv|curriculum|cover letter)\b/.test(text)) {
    return "Tailor your resume to each role: put the most relevant experience first, use specific examples of your impact, and mirror the job description’s key skills when they genuinely match your background.";
  }
  if (/\b(salary|pay|compensation|wage)\b/.test(text)) {
    return "The salary shown on a listing is example data, not a verified offer. Check the currency, location, and full compensation details with the employer before making a decision.";
  }
  if (/\b(account|sign.?up|register|login|log in|password)\b/.test(text)) {
    return "Use Log in or Register in the navigation to access an account. Real sign-in and registration need the backend and database to be running.";
  }
  if (/\b(data|dummy|sample|demo|replace)\b/.test(text)) {
    return "The current job cards are sample data kept in frontend/src/data/demoJobs.js. Once you’re ready, add your real jobs through the employer flow or connect your database/API; live API results automatically take priority over the samples.";
  }

  return "I can help with browsing jobs, applications, resumes, salaries, or the sample data. Try asking one of those, and I’ll point you in the right direction.";
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const submittedQuestion = question.trim();
    if (!submittedQuestion) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: submittedQuestion },
      { role: "assistant", text: getAssistantReply(submittedQuestion) },
    ]);
    setQuestion("");
  };

  return (
    <aside className="chatbot" aria-label="LookJobber demo assistant">
      {isOpen && (
        <section className="chatbot-panel" aria-label="Chat with the assistant">
          <header className="chatbot-header">
            <div>
              <strong>LookJobber assistant</strong>
              <span>Demo answers · no AI service connected</span>
            </div>
            <button
              className="chatbot-close"
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <FiX aria-hidden="true" />
            </button>
          </header>
          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message, index) => (
              <p className={`chat-message ${message.role}`} key={`${index}-${message.role}`}>
                {message.text}
              </p>
            ))}
          </div>
          <form className="chatbot-form" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="chatbot-question">
              Ask a question
            </label>
            <input
              id="chatbot-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about jobs..."
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!question.trim()}
            >
              <FiSend aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
      <button
        className="chatbot-toggle"
        type="button"
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <FiX aria-hidden="true" /> : <FiMessageCircle aria-hidden="true" />}
        <span>{isOpen ? "Close" : "Ask us"}</span>
      </button>
    </aside>
  );
};

export default Chatbot;
