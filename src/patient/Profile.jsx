import React from "react";
import "./css/Profile.css"; // Assuming you have a CSS file for styling

const Profile = ({ patient }) => {
  function getAge(dobString) {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  function getLatestEntry(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return null;

    return entries.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
  }

  const renderSection = (title, items) => (
    <section>
      <h4>{title}</h4>
      <div className="container">
        {items.map((item, index) => (
          <div className="list" key={index}>
            <div className="label">{item.label}</div>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );

  const latestHistory = getLatestEntry(patient?.patientHistories);
  console.log("Latest History:", latestHistory);
  console.log("Patient Data:", patient);

  // Obstetric History
  const obstetricHistoryDetails = [
    { label: "Gravida", value: latestHistory?.gravida ?? "-" },
    { label: "Parity", value: latestHistory?.parity ?? "-" },
    { label: "C-Section", value: latestHistory?.csection ?? "-" },
    { label: "C-Section Count", value: latestHistory?.csectionNum ?? "-" },
    { label: "Postpartum Hemorrhage (PPH)", value: latestHistory?.pph ?? "-" },
    { label: "Infertility", value: latestHistory?.infertility ?? "-" },
    { label: "IVF", value: latestHistory?.ivf ?? "-" },
    {
      label: "Interpregnancy Interval (months)",
      value: latestHistory?.interval ?? "-",
    },
    { label: "Miscarriage", value: latestHistory?.miscarriage ?? "-" },
    {
      label: "Miscarriage Count",
      value: latestHistory?.miscarriageNum ?? "-",
    },
    { label: "Stillbirth", value: latestHistory?.stillbirth ?? "-" },
    { label: "Stillbirth Count", value: latestHistory?.stillbirthNum ?? "-" },
    {
      label: "History of Eclampsia",
      value: latestHistory?.eclampsiaHistory ?? "-",
    },
    {
      label: "History of GDM",
      value: latestHistory?.gestationalDiabetesHistory ?? "-",
    },
    {
      label: "History of Gestational HTN",
      value: latestHistory?.gestationalHypertensionHistory ?? "-",
    },
    {
      label: "History of Preeclampsia",
      value: latestHistory?.preeclampsiaHistory ?? "-",
    },
    {
      label: "Previous Child's Weight",
      value: latestHistory?.prevChildWeight ?? "-",
    },
    {
      label: "Previous Gynecological Surgery",
      value: latestHistory?.prevGynaSurgery ?? "-",
    },
    { label: "Prolonged Labour", value: latestHistory?.prolongedLabour ?? "-" },
    {
      label: "Prolonged Labour Duration",
      value: latestHistory?.prolongedLabourHours ?? "-",
    },
    {
      label: "Contraceptives Used",
      value: latestHistory?.contraceptives ?? "-",
    },
    {
      label: "Anemia in Pregnancy",
      value: latestHistory?.pregnancyHistoryAnemia ?? "-",
    },
  ];

  // Family History
  const familyHistoryDetails = [
    {
      label: "Preeclampsia",
      value: latestHistory?.famHistoryPreeclampsia ?? "-",
    },
    {
      label: "Cardiac Disease",
      value: latestHistory?.famHistoryCardiacDisease ?? "-",
    },
    {
      label: "Gestational Hypertension",
      value: latestHistory?.famHistoryGestationalHypertension ?? "-",
    },
    {
      label: "Gestational Diabetes",
      value: latestHistory?.famHistoryGestationalDiabetes ?? "-",
    },
    { label: "Anemia", value: latestHistory?.famHistoryAnemia ?? "-" },
    { label: "Obesity", value: latestHistory?.famObeseHistory ?? "-" },
    {
      label: "Autoimmune Disorders",
      value: latestHistory?.famHistoryAutoimmune ?? "-",
    },
    {
      label: "Hypertension",
      value: latestHistory?.famHistoryHypertension ?? "-",
    },
    { label: "Sickle Cell", value: latestHistory?.famSickleCell ?? "-" },
    { label: "Thalassemia", value: latestHistory?.famThalassemia ?? "-" },
    { label: "Partner's Age", value: latestHistory?.maleAge ?? "-" },
    {
      label: "Partner's Preeclampsia History",
      value: latestHistory?.malePreeclampsiaPrevHistory ?? "-",
    },
  ];

  // Medical History
  const medicalHistoryDetails = [
    { label: "Autoimmune Disorders", value: latestHistory?.autoimmune ?? "-" },
    { label: "Anemia", value: latestHistory?.anemia ?? "-" },
    { label: "Liver Disorders", value: latestHistory?.liver ?? "-" },
    { label: "Thyroid Disorders", value: latestHistory?.thyroid ?? "-" },
    { label: "Cardiac Disease", value: latestHistory?.cardiacDisease ?? "-" },
    {
      label: "Chronic Hypertension",
      value: latestHistory?.chronicHypertension ?? "-",
    },
    {
      label: "Chronic Renal Disease",
      value: latestHistory?.chronicRenalDisease ?? "-",
    },
    {
      label: "Diabetes Mellitus",
      value: latestHistory?.diabetesMelitus ?? "-",
    },
    { label: "Kidney Disorders", value: latestHistory?.kidney ?? "-" },
    {
      label: "Rheumatoid Arthritis",
      value: latestHistory?.rheumatoidArthritis ?? "-",
    },
    { label: "Menorrhagia", value: latestHistory?.menorrhagia ?? "-" },
    { label: "PCOS", value: latestHistory?.pcos ?? "-" },
    {
      label: "Uterine Fibroids",
      value: latestHistory?.uterineFibroids ?? "-",
    },
    { label: "Hypothyroidism", value: latestHistory?.hypothyroidism ?? "-" },
  ];

  const patientInfo = patient; // or patient?.[0] depending on how you're loading it

  const personalDetails = [
    { label: "Full Name", value: patientInfo?.name || "-" },
    { label: "Date of Birth", value: patientInfo?.dob || "-" },
    {
      label: "Age",
      value: patientInfo?.age ? `${patientInfo.age} years` : `${getAge(patientInfo.dob)} Years`,
    },
    {
      label: "Race",
      value:
        patientInfo?.race === "Other"
          ? patientInfo?.raceOther || "Other"
          : patientInfo?.race || "-",
    },
    {
      label: "Blood Type",
      value: `${patientInfo?.bloodgroup || "-"} ${
        patientInfo?.rh || ""
      }`.trim(),
    },
    { label: "Hospital", value: patientInfo?.hospital || "-" },
  ];

  const contactDetails = [
    { label: "Phone Number", value: patientInfo?.phone || "-" },
    { label: "Email", value: patientInfo?.email || "-" },
    { label: "Address", value: patientInfo?.address || "-" },
    { label: "Insurance", value: patientInfo?.insurance || "-" },
    { label: "Occupation", value: patientInfo?.occupation || "-" },
  ];

  const healthSummary = [
    //   { label: "User ID", value: patientInfo?.user_id || "-" },
    { label: "Address ", value: patientInfo?.address || "-" },
    { label: "Date Registered", value: patientInfo?.createdAt || "-" },
  ];

  return (
    <div className="profile-page">
      <div className="left">
        {renderSection("Obstetric History", obstetricHistoryDetails)}
        {renderSection("Family History", familyHistoryDetails)}
      </div>
      <div className="righty">
        {renderSection("Patient Details", personalDetails)}
        {renderSection("Contact Details", contactDetails)}
        {renderSection("Health Summary", healthSummary)}
        {renderSection("Medical History", medicalHistoryDetails)}
      </div>
    </div>
  );
};

export default Profile;
