"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    setUser(currentUser);

    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      setRole(profile?.role);
      fetchTasks();
    }
  }

  async function fetchTasks() {
    const { data, error } = await supabase.from("tasks").select("*");
    if (!error) setTasks(data);
  }

  async function signUp() {
    if (password.length < 8) {
      return alert("Password must be at least 8 characters long");
    }

    await supabase.auth.signUp({ email, password });
    alert("Signup successful. Now login.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      checkUser();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setTasks([]);
  }

  async function addTask() {
    if (!newTask) return alert("Enter task title");

    const { error } = await supabase.from("tasks").insert([
      {
        title: newTask,
        assigned_to: user.id,
        status: "pending",
        due_date: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert("Error adding task: " + error.message);
    } else {
      setNewTask("");
      fetchTasks();
    }
  }

  if (!user) {
    return (
      <div id="bg" className="min-h-screen flex items-center justify-center p-4">
  <div className="w-full max-w-md backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl rounded-2xl p-8 text-white">
    
    <h1 className="text-3xl font-bold mb-4 text-center">
      Client Task Dashboard
    </h1>

    <img
      alt="Your Company"
      src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
      className="mx-auto h-12 w-auto mb-6"
    />

    <h2 className="text-center text-2xl font-semibold mb-6">
      Login
    </h2>

    <label className="block text-sm font-medium mb-1">
      Email address
    </label>
    <input
      type="email"
      placeholder="Email"
      onChange={(e) => setEmail(e.target.value)}
      value={email}
      className="w-full mb-4 px-4 py-2 rounded-lg bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
    />

    <label className="block text-sm font-medium mb-1">
      Password
    </label>
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full mb-6 px-4 py-2 rounded-lg bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
    />

    <div className="flex justify-center gap-6">
      <button
        onClick={signUp}
      >
        Sign Up
      </button>

      <button
        onClick={signIn}
      >
        Login
      </button>
    </div>

  </div>
</div>

    );
  }

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <strong>{user.email}: </strong>
      <button
        onClick={signOut}
        style={{ backgroundColor: "rgba(255, 0, 0, 0.475)" }}
      >
        Logout
      </button>
      <br /> <br />
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className="px-3 py-1 border rounded hover:bg-gray-200"
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className="px-3 py-1 border rounded hover:bg-gray-200"
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("completed")}
          className="px-3 py-1 border rounded hover:bg-gray-200"
        >
          Completed
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Enter task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </div>
      {filteredTasks.length === 0 ? (
        <p className="text-gray-500">No tasks found</p>
      ) : (
        filteredTasks.map((task) => {
          const isOverdue =
            task.status !== "completed" &&
            task.due_date &&
            new Date(task.due_date) < new Date();

          return (
            <div
              key={task.id}
              className="border p-3 rounded mb-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {task.title} —{" "}
                  <span
                    className={
                      task.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {task.status}
                  </span>
                  {isOverdue && (
                    <span className="text-red-600 ml-2">🔴 Overdue</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await supabase
                      .from("tasks")
                      .update({
                        status:
                          task.status === "pending" ? "completed" : "pending",
                      })
                      .eq("id", task.id);
                    fetchTasks();
                  }}
                  className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                >
                  Toggle
                </button>
                <button
                  onClick={async () => {
                    const updatedTitle = prompt("Edit task title:", task.title);
                    if (!updatedTitle) return;
                    await supabase
                      .from("tasks")
                      .update({ title: updatedTitle })
                      .eq("id", task.id);
                    fetchTasks();
                  }}
                  className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                >
                  Edit
                </button>

                {role === "admin" ? (
                  <button
                    style={{ backgroundColor: "rgba(255, 0, 0, 0.475)" }}
                    onClick={async () => {
                      const { error } = await supabase
                        .from("tasks")
                        .delete()
                        .eq("id", task.id);

                      if (error) {
                        alert("Delete error: " + error.message);
                      } else {
                        fetchTasks();
                      }
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    style={{ backgroundColor: "rgba(255, 0, 0, 0.475)" }}
                    onClick={() => alert("Only admin can delete tasks")}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
