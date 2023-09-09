"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./db";
import { useLiveQuery } from "dexie-react-hooks";

export default function Home() {
  const textValues = useLiveQuery(() => db.textValues.toArray());

  // Keep track of the classification result and the model loading status.
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(null);

  const [dbValuesView, setDbValuesView] = useState(false);

  // Create a reference to the worker object.
  const worker = useRef(null);

  // add text to db
  async function addResultToDB(text, output) {
    try {
      // Add the new friend!
      const id = await db.textValues.add({
        text,
        classification: output,
      });

      console.log(`${text} successfully added with id: ${id}`);
    } catch (error) {
      throw Error(error.message);
    }
  }

  // We use the `useEffect` hook to set up the worker as soon as the `App` component is mounted.
  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "initiate":
          setReady(false);
          break;
        case "ready":
          setReady(true);
          break;
        case "complete":
          setResult(e.data.output[0]);
          addResultToDB(e.data.text, e.data.output[0]);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  const classify = useCallback((text) => {
    if (worker.current) {
      worker.current.postMessage({ text });
    }
  }, []);

  console.log(textValues, "textValues");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-5 text-center">
        Text Classification
      </h1>

      <input
        className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4"
        type="text"
        placeholder="Enter text here"
        onInput={(e) => {
          classify(e.target.value);
        }}
      />

      {ready !== null && (
        <pre className="bg-gray-100 p-2 rounded">
          {!ready || !result ? "Loading..." : JSON.stringify(result, null, 2)}
        </pre>
      )}

      <button
        className="bg-white rounded w-40 h-10 mt-20"
        onClick={() => setDbValuesView(!dbValuesView)}
      >
        {!dbValuesView ? 'Show' :'Hide'} All Values
      </button>

      {dbValuesView ? (
        textValues.length ? (
          <ul className="mt-5 max-h-96 overflow-scroll bg-white px-2 rounded shadow-xl">
            {textValues.map(
              ({ text, classification: { label, score } }, index) => (
                <li key={index} className="mb-2">
                  <span className="font-bold"> {text}: </span>{" "}
                  <span
                    className={`${
                      label.startsWith("P") ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {" "}
                    {label}{" "}
                  </span>{" "}
                  {score}{" "}
                </li>
              )
            )}
          </ul>
        ) : (
          <div className="mt-5">No Values </div>
        )
      ) : null}
    </main>
  );
}
