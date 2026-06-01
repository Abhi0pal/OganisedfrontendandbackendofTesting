"use client";

import React, { useState } from "react";
import Modal from "@/components/common/Modal";

export default function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrimaryClick = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <div className="p-4">
      <button
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
      >
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
      >
        <p>This is the modal content. Add your form or message here.</p>
        <form>
          <div className="mb-3">
            <label htmlFor="exampleInput" className="form-label">
              Email address
            </label>
            <input
              type="email"
              className="form-control"
              id="exampleInput"
              placeholder="Enter email"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="exampleMessage" className="form-label">
              Message
            </label>
            <textarea
              className="form-control"
              id="exampleMessage"
              rows={3}
              placeholder="Enter message"
            />
          </div>
        </form>
        <div className="mt-4 d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrimaryClick}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
