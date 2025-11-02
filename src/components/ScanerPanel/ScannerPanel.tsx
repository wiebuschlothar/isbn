import * as React from "react";

export type ScannerPanelProps = {
  onSubmitIsbn?: (isbn: string) => void;
};

export const ScannerPanel: React.FunctionComponent<ScannerPanelProps> = ({ onSubmitIsbn }) => {
  const [isbn, setIsbn] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just log the ISBN value. Replace with your desired action.
    console.log("Submitted ISBN:", isbn);
    // Call external handler if provided
    onSubmitIsbn?.(isbn);
  };

  return (
    <form onSubmit={handleSubmit} className="scanner-form">
      <label htmlFor="isbn-input" className="label-control">
        ISBN
      </label>
      <input
        id="isbn-input"
        name="isbn"
        type="text"
        value={isbn}
        onChange={(e) => setIsbn(e.target.value)}
        placeholder="Enter ISBN"
        className="input-control"
      />
      <button type="submit" className="button-control">
        Submit
      </button>
    </form>
  );
};
