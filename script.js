const internships = [
    {
        id: "INT-101",
        title: "Frontend Intern",
        domain: "Full Stack Development",
        mode: "Remote",
        location: "India",
        skills: ["HTML", "CSS", "JavaScript"],
        openings: 3
    },
    {
        id: "INT-102",
        title: "API Engineering Intern",
        domain: "Full Stack Development",
        mode: "Hybrid",
        location: "Pune",
        skills: ["Node.js", "SQL", "Testing"],
        openings: 2
    },
    {
        id: "INT-103",
        title: "UI/UX Intern",
        domain: "UI/UX",
        mode: "Remote",
        location: "India",
        skills: ["Figma", "Research", "Accessibility"],
        openings: 1
    },
    {
        id: "INT-104",
        title: "Data Analyst Intern",
        domain: "Data Analytics",
        mode: "On-site",
        location: "Bengaluru",
        skills: ["Excel", "SQL", "Data visualisation"],
        openings: 2
    },
    {
        id: "INT-105",
        title: "Security Operations Intern",
        domain: "Cyber Security",
        mode: "Remote",
        location: "India",
        skills: ["Linux", "Logs", "Networking"],
        openings: 1
    }
];

const internshipList = document.getElementById("internship-list");
const searchInput = document.getElementById("search-input");
const domainFilter = document.getElementById("domain-filter");
const modeFilter = document.getElementById("mode-filter");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");
const applicationForm = document.getElementById("application-form");
const applicationMessage = document.getElementById("application-message");
const internshipSelect = document.getElementById("application-internship");

let loading = false;

function showMessage(message) {
    internshipList.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    internshipList.appendChild(paragraph);
}

function displayInternships(records) {
    internshipList.replaceChildren();

    if (records.length === 0) {
        showMessage("No internships found. Try another search or filter.");
        return;
    }

    records.forEach((internship) => {
        const card = document.createElement("article");
        card.className = "internship-card";

        const title = document.createElement("h3");
        title.textContent = internship.title;

        const details = [
            `ID: ${internship.id}`,
            `Domain: ${internship.domain}`,
            `Work mode: ${internship.mode}`,
            `Location: ${internship.location}`,
            `Skills: ${internship.skills.join(", ")}`,
            `Openings: ${internship.openings}`
        ];

        card.appendChild(title);

        details.forEach((detail) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = detail;
            card.appendChild(paragraph);
        });

        const detailsButton = document.createElement("button");
        detailsButton.type = "button";
        detailsButton.textContent = "View Details";

        detailsButton.addEventListener("click", () => {
            alert(`${internship.title}\n\n${details.join("\n")}`);
        });

        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.textContent = "Apply";
        applyButton.style.marginLeft = "8px";

        applyButton.addEventListener("click", () => {
            internshipSelect.value = internship.id;
            document.getElementById("applicant-name").focus();
            document.getElementById("application-title")
                .scrollIntoView({ behavior: "smooth" });
        });

        card.append(detailsButton, applyButton);
        internshipList.appendChild(card);
    });
}

function filterInternships() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedDomain = domainFilter.value;
    const selectedMode = modeFilter.value;

    const filtered = internships.filter((internship) => {
        const searchableText = [
            internship.title,
            internship.domain,
            internship.mode,
            internship.location,
            ...internship.skills
        ].join(" ").toLowerCase();

        return (
            searchableText.includes(searchText) &&
            (!selectedDomain || internship.domain === selectedDomain) &&
            (!selectedMode || internship.mode === selectedMode)
        );
    });

    displayInternships(filtered);
}

function loadInternships() {
    loading = true;
    errorMessage.hidden = true;
    internshipList.hidden = false;
    showMessage("Loading internships...");

    // The records are local, so no internet request is required.
    try {
        loading = false;
        filterInternships();
    } catch (error) {
        loading = false;
        internshipList.hidden = true;
        errorMessage.hidden = false;
    }
}

searchInput.addEventListener("input", filterInternships);
domainFilter.addEventListener("change", filterInternships);
modeFilter.addEventListener("change", filterInternships);
retryButton.addEventListener("click", loadInternships);

applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("applicant-name").value.trim();
    const email = document.getElementById("applicant-email").value.trim();
    const internshipId = internshipSelect.value;

    if (!name || !email || !internshipId) {
        applicationMessage.textContent = "Please complete all fields.";
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        applicationMessage.textContent =
            "Please enter a valid email address.";
        return;
    }

    applicationMessage.textContent =
        "Demo only: your application was checked but not saved or sent. " +
        "A backend API is needed to submit applications.";

    applicationForm.reset();
});

loadInternships();