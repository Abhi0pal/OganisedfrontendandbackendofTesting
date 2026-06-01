"use client";

import React from "react";
import "./timeline.css";

type Step = {
  id: string;
  title: string;
  position: "top" | "bottom";
  active?: boolean;
};

const steps: Step[] = [
  { id: "01", title: "Text Extraction from SRS", position: "top", active: true },
  { id: "02", title: "Text Parsing to LLM", position: "bottom", active: true },
  { id: "03", title: "Reading SRS", position: "top", active: true },
  { id: "04", title: "Preparing the Form JSON", position: "bottom", active: true },
  { id: "05", title: "Preparing the DMS JSON", position: "top", active: true },
  { id: "06", title: "Preparing the Workflow JSON", position: "bottom" , active: true},
  { id: "07", title: "Publishing the JSON", position: "top", active: true },
];

export default function Timeline() {
  return (
    <div className="timeline-wrapper">

      {/* <h2 className="timeline-title">Process Flow</h2> */}

      <div className="timeline-scroll">
        <div className="timeline-container">

          {/* CENTER LINE */}
          <div className="timeline-line"></div>

          {steps.map((step, index) => (
            <div key={index} className="timeline-step">

              {/* TOP TEXT */}
              {step.position === "top" && (
                <>
                  <div className="timeline-text top">{step.title}</div>
                  <div className="timeline-stick"></div>
                </>
              )}

              {/* CIRCLE */}
              <div className="timeline-circle-outer">
                <div
                  className={`timeline-circle-inner ${
                    step.active ? "active" : ""
                  }`}
                >
                  {step.id}
                </div>
              </div>

              {/* BOTTOM TEXT */}
              {step.position === "bottom" && (
                <>
                  <div className="timeline-stick"></div>
                  <div className="timeline-text bottom">{step.title}</div>
                </>
              )}

            </div>
          ))}

        </div>
      </div>
    </div>
  );
}