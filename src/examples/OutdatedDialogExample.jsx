import React from "react";
import OutdatedDialog from "../components/Outdated";
import useOutdatedDialog from "../hooks/useOutdatedDialog";

const OutdatedDialogExample = () => {
  const { showDialog, dialogConfig, showOutdatedDialog } = useOutdatedDialog();

  const handleTestDialog = async () => {
    const result = await showOutdatedDialog({
      title: "Test Dialog",
      message: "This is a test dialog.\nDo you want to proceed?",
      confirmText: "Yes, Proceed",
      cancelText: "No, Cancel"
    });
    
    console.log("User choice:", result);
    alert(`User chose: ${result ? "Proceed" : "Cancel"}`);
  };

  const handleDataValidationExample = async () => {
    // Simulate checking data age
    const outdatedItems = ["Patient vitals", "Lab results", "Medical history"];
    
    const result = await showOutdatedDialog({
      title: "Outdated Data Detected",
      message: `The following data is more than 7 days old:\n- ${outdatedItems.join("\n- ")}\n\nProceeding may affect accuracy.`,
      confirmText: "Proceed Anyway",
      cancelText: "Update Data First"
    });
    
    if (result) {
      alert("Proceeding with outdated data...");
      // Continue with form submission
    } else {
      alert("Please update the data first.");
      // Redirect to update forms or show update options
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Outdated Dialog Examples</h2>
      
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleTestDialog}>
          Test Basic Dialog
        </button>
      </div>
      
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleDataValidationExample}>
          Test Data Validation Dialog
        </button>
      </div>

      {showDialog && <OutdatedDialog {...dialogConfig} />}
    </div>
  );
};

export default OutdatedDialogExample;