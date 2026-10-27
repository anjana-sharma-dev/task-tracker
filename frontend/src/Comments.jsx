import { useEffect, useState } from "react";
import { getComments, createComment } from "./api";

export default function Comments({taskId}){
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  
  useEffect(() => {
    if (open) {
      getComments(taskId).then(setComments).catch((e)=> console.error(e));
    }
  }, [open, taskId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await createComment(taskId, { content: text});
      setText("");
      setComments(await getComments(taskId));
    } catch (err) {
      alert(err.message);
    }
  }

  return(
    <div>
      <button onClick={() => setOpen(!open)}>{open ? "Hide Comments": "Comments"}</button>
      {open && (
          <div>
            {comments.map((c)=> (
              <p key={c.id}>User{c.user_id}: {c.content}</p>
            ))}
            <form onSubmit={handleSubmit}>
              <input value={text} onChange={(e)=> setText(e.target.value)} placeholder="Write a comments"/>
              <button type="submit">Send</button>
            </form>
          </div>
      )}
    </div>
  );
}

