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

  const latestHistory = getLatestEntry(patient?.histories);
  console.log("Latest History:", latestHistory);
  console.log("Patient Data:", patient);

  // Obstetric History
  const obstetricHistoryDetails = [
    { label: "Gravida", value: latestHistory?.gravida ?? "-" },
    { label: "Parity", value: latestHistory?.parity ?? "-" },
    { label: "C-Section", value: latestHistory?.csection ?? "-" },
    { label: "C-Section Count", value: latestHistory?.csection_num ?? "-" },
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
      value: latestHistory?.miscarriage_num ?? "-",
    },
    { label: "Stillbirth", value: latestHistory?.stillbirth ?? "-" },
    { label: "Stillbirth Count", value: latestHistory?.stillbirth_num ?? "-" },
    {
      label: "History of Eclampsia",
      value: latestHistory?.eclampsiahistory ?? "-",
    },
    {
      label: "History of GDM",
      value: latestHistory?.gestationaldiabeteshistory ?? "-",
    },
    {
      label: "History of Gestational HTN",
      value: latestHistory?.gestationalhypertensionhistory ?? "-",
    },
    {
      label: "History of Preeclampsia",
      value: latestHistory?.preeclampsiahistory ?? "-",
    },
    {
      label: "Previous Child's Weight",
      value: latestHistory?.prevchildweight ?? "-",
    },
    {
      label: "Previous Gynecological Surgery",
      value: latestHistory?.prevgynasurgery ?? "-",
    },
    { label: "Prolonged Labour", value: latestHistory?.prolongedlabour ?? "-" },
    {
      label: "Prolonged Labour Duration",
      value: latestHistory?.prolongedlabour_hours ?? "-",
    },
    {
      label: "Contraceptives Used",
      value: latestHistory?.contraceptives ?? "-",
    },
    {
      label: "Anemia in Pregnancy",
      value: latestHistory?.pregnancyhistoryanemia ?? "-",
    },
  ];

  // Family History
  const familyHistoryDetails = [
    {
      label: "Preeclampsia",
      value: latestHistory?.famhistorypreeclampsia ?? "-",
    },
    {
      label: "Cardiac Disease",
      value: latestHistory?.famhistorycardiacdisease ?? "-",
    },
    {
      label: "Gestational Hypertension",
      value: latestHistory?.famhistorygestationalhypertension ?? "-",
    },
    {
      label: "Gestational Diabetes",
      value: latestHistory?.famhistorygestationaldiabetes ?? "-",
    },
    { label: "Anemia", value: latestHistory?.famhistoryanemia ?? "-" },
    { label: "Obesity", value: latestHistory?.famobesehistory ?? "-" },
    {
      label: "Autoimmune Disorders",
      value: latestHistory?.famhistoryautoimmune ?? "-",
    },
    {
      label: "Hypertension",
      value: latestHistory?.famhistoryhypertension ?? "-",
    },
    { label: "Sickle Cell", value: latestHistory?.famsickle_cell ?? "-" },
    { label: "Thalassemia", value: latestHistory?.famthalassemia ?? "-" },
    { label: "Partner's Age", value: latestHistory?.male_age ?? "-" },
    {
      label: "Partner's Preeclampsia History",
      value: latestHistory?.malepreeclampsiaprevhistory ?? "-",
    },
  ];

  // Medical History
  const medicalHistoryDetails = [
    { label: "Autoimmune Disorders", value: latestHistory?.autoimmune ?? "-" },
    { label: "Anemia", value: latestHistory?.anemia ?? "-" },
    { label: "Liver Disorders", value: latestHistory?.liver ?? "-" },
    { label: "Thyroid Disorders", value: latestHistory?.thyroid ?? "-" },
    { label: "Cardiac Disease", value: latestHistory?.cardiacdisease ?? "-" },
    {
      label: "Chronic Hypertension",
      value: latestHistory?.chronichypertension ?? "-",
    },
    {
      label: "Chronic Renal Disease",
      value: latestHistory?.chronicrenaldisease ?? "-",
    },
    {
      label: "Diabetes Mellitus",
      value: latestHistory?.diabetesmelitus ?? "-",
    },
    { label: "Kidney Disorders", value: latestHistory?.kidney ?? "-" },
    {
      label: "Rheumatoid Arthritis",
      value: latestHistory?.rheumatoid_arthritis ?? "-",
    },
    { label: "Menorrhagia", value: latestHistory?.menorrhagia ?? "-" },
    { label: "PCOS", value: latestHistory?.pcos ?? "-" },
    {
      label: "Uterine Fibroids",
      value: latestHistory?.uterine_fibroids ?? "-",
    },
    { label: "Hypothyroidism", value: latestHistory?.hypothyroidism ?? "-" },
  ];

  const patientInfo = patient; // or patient?.[0] depending on how you're loading it

  const personalDetails = [
    { label: "Full Name", value: patientInfo?.name || "-" },
    { label: "Date of Birth", value: patientInfo?.dob || "-" },
    {
      label: "Age",
      value: patientInfo?.age ? `${patientInfo.age} years` : "-",
    },
    {
      label: "Race",
      value:
        patientInfo?.race === "Other"
          ? patientInfo?.race_other || "Other"
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
    { label: "Phone Number", value: patientInfo?.phone_number || "-" },
    { label: "Email", value: patientInfo?.email || "-" },
    { label: "Address", value: patientInfo?.address || "-" },
    { label: "Insurance", value: patientInfo?.insurance || "-" },
    { label: "Occupation", value: patientInfo?.occupation || "-" },
  ];

  const healthSummary = [
    //   { label: "User ID", value: patientInfo?.user_id || "-" },
    { label: "Org ID", value: patientInfo?.org_id || "-" },
    { label: "Date Registered", value: patientInfo?.date || "-" },
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
