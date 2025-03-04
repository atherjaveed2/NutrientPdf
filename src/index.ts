/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import PSPDFKit from "@nutrient-sdk/viewer";
let instance: any = null;
let highlightedElement: HTMLElement | null = null;
let objectUrl = "";
const redactionTexts = [
 "when the 11yo SB was two years old",
 "Based on the evidence that was gathered during the course of the investigation, there was not sufficient evidence to substantiate the allegation",
 "Intake Narrative",
 "The FA then took the OV to Driscoll Hospital.",
 "Person Notes",
 "Allegation Detail",
];
//const redactionTexts = ["facilities", "HOURLY RATES", "Review and prepare work directives & change orders" ];
let uploadedJsonData: any = null;
// Create the left panel for extracted text
function createLeftPanel() {
 const leftPanel = document.createElement("div");
 leftPanel.id = "left-panel";
 leftPanel.style.width = "250px";
 leftPanel.style.height = "100vh";
 leftPanel.style.overflowY = "auto";
 leftPanel.style.padding = "10px";
 leftPanel.style.backgroundColor = "#f4f4f4";
 leftPanel.style.borderRight = "1px solid #ccc";
 leftPanel.style.position = "relative"; // Set position to relative for the resizer
 // Create file input and add it to the left panel
 const fileInput = document.createElement("input");
 fileInput.type = "file";
 fileInput.id = "fileInput";
 fileInput.className = "chooseFile";
 fileInput.title = "";
 fileInput.accept = ".pdf,.doc,.docx";
 fileInput.style.marginBottom = "10px";
 leftPanel.appendChild(fileInput);
 const fileInputJson = document.createElement("input");
 fileInputJson.type = "file";
 fileInputJson.id = "fileInputJson";
 fileInputJson.className = "chooseFile";
 fileInputJson.title = "";
 fileInputJson.accept = ".json";
 fileInputJson.style.marginBottom = "10px";
 leftPanel.appendChild(fileInputJson); // Create a container div for redaction input and button
 const redactionContainer = document.createElement("div");
 redactionContainer.style.display = "flex"; // Set to flex for responsive layout
 redactionContainer.style.flexDirection = "column"; // Stack items vertically
 redactionContainer.style.marginTop = "10px"; // Add margin for spacing
 // Create an input field
 // const inputField = document.createElement("input");
 // inputField.type = "text";
 // inputField.placeholder = "Enter text...";
 // inputField.id = "redactionInput";
 // inputField.style.padding = "5px";
 // inputField.style.flexGrow = "1"; // Allow the input to grow
 // Create the button
 const markRedaction = document.createElement("button");
 markRedaction.innerText = "Add Automatic Text Redactions";
 markRedaction.id = "markRedaction";
 markRedaction.style.padding = "5px 10px";
 markRedaction.style.cursor = "pointer";
 markRedaction.style.marginTop = "5px"; // Add margin for spacing
 // Append input and button to the container
 // redactionContainer.appendChild(inputField);
 redactionContainer.appendChild(markRedaction); // Append the container to the left panel
 leftPanel.appendChild(redactionContainer); // Create the Add Automatic Redactions button
 const addRedactionsButton = document.createElement("button");
 addRedactionsButton.innerText = "Add Automatic Coordinates Redactions";
 addRedactionsButton.id = "addRedactionsButton";
 addRedactionsButton.style.marginTop = "10px";
 addRedactionsButton.style.width = "100%"; // Make button full width
 leftPanel.appendChild(addRedactionsButton);
 leftPanel.innerHTML += "<br><br><h3>Extracted Text</h3>";
 const textContainer = document.createElement("div");
 textContainer.id = "text-container";
 leftPanel.appendChild(textContainer); // Create a resizer element
 const resizer = document.createElement("div");
 resizer.id = "resizer"; // Add an ID for styling
 resizer.className = "resizer";
 resizer.style.width = "10px"; // Width of the resizer
 resizer.style.cursor = "ew-resize"; // Cursor style for resizing
 resizer.style.position = "absolute";
 resizer.style.top = "0";
 resizer.style.right = "-5px"; // Position it outside the sidebar
 resizer.style.height = "100%";
 resizer.style.zIndex = "10"; // Ensure it's above other elements
 leftPanel.appendChild(resizer); // Add event listeners for resizing
 resizer.addEventListener("mousedown", (e) => {
 e.preventDefault();
 document.addEventListener("mousemove", resizePanel);
 document.addEventListener("mouseup", stopResize);
 });
 function resizePanel(e: MouseEvent) {
 const newWidth = e.clientX; // Get the new width based on mouse position
 if (newWidth > 150 && newWidth < window.innerWidth - 50) {
  leftPanel.style.width = `${newWidth}px`;
 }
 }
 function stopResize() {
 document.removeEventListener("mousemove", resizePanel);
 document.removeEventListener("mouseup", stopResize);
 }
 document.body.appendChild(leftPanel);

  // Create the toggle view button
  const toggleViewButton = document.createElement("button");
  toggleViewButton.innerText = "Toggle View Mode";
  toggleViewButton.id = "toggleViewButton";
  toggleViewButton.style.marginTop = "10px";
  toggleViewButton.style.width = "100%"; // Make button full width
  
  leftPanel.appendChild(toggleViewButton);



// Toggle view button functionality
toggleViewButton.onclick = () => {
  // Get the current view state
  const currentViewState = instance.viewState;

  // Determine the current scroll mode
  const currentScrollMode = currentViewState.scrollMode;

  // Toggle the scroll mode
  const newScrollMode = currentScrollMode === PSPDFKit.ScrollMode.CONTINUOUS
    ? PSPDFKit.ScrollMode.DISABLED
    : PSPDFKit.ScrollMode.CONTINUOUS;

  // Keep the current page index and zoom level
  const currentPageIndex = currentViewState.currentPageIndex;
  const zoomLevel = currentViewState.zoomLevel; // Keep the current zoom level

  // Update the view state with the new scroll mode, lock to the current page, and set the zoom level
  const newViewState = currentViewState
    .set("scrollMode", newScrollMode)
    .set("currentPageIndex", currentPageIndex)
    .set("zoomLevel", zoomLevel); // Maintain the current zoom level

  // Update the viewer with the new view state
  instance.setViewState(newViewState);
};


 // Create the rotate clockwise button
 const rotateClockwiseButton = document.createElement("button");
 rotateClockwiseButton.innerText = "Rotate Clockwise";
 rotateClockwiseButton.id = "rotateClockwise";
 rotateClockwiseButton.style.marginTop = "10px";
 rotateClockwiseButton.style.width = "100%"; // Make button full width
 leftPanel.appendChild(rotateClockwiseButton);

 // Create the rotate counterclockwise button
 const rotateCounterclockwiseButton = document.createElement("button");
 rotateCounterclockwiseButton.innerText = "Rotate Counterclockwise";
 rotateCounterclockwiseButton.id = "rotateCounterclockwise";
 rotateCounterclockwiseButton.style.marginTop = "10px";
 rotateCounterclockwiseButton.style.width = "100%"; // Make button full width
 leftPanel.appendChild(rotateCounterclockwiseButton);

 // Add event listeners to the rotation buttons
 rotateClockwiseButton.addEventListener("click", rotatePageClockwise);
 rotateCounterclockwiseButton.addEventListener("click", rotatePageCounterclockwise);



}
createLeftPanel();
// Create the PSPDFKit viewer container on the right
const viewerContainer = document.createElement("div");
viewerContainer.id = "viewer-container";
viewerContainer.classList.add("viewer-container");
viewerContainer.style.flexGrow = "1";
document.body.appendChild(viewerContainer);
// const markRedaction = document.getElementById("markRedaction");
// if(markRedaction){
// markRedaction.onclick = () =>{
// const inputText = (document.getElementById("redactionInput") as HTMLInputElement).value;
// (document.getElementById("redactionInput") as HTMLInputElement).value="";
// if (inputText.trim() === "") {
// alert("Please enter text before marking redactions.");
// return;
// }
// instance.createRedactionsBySearch(inputText, {
// searchInAnnotations: false
// })
// }
// }
const markRedaction = document.getElementById("markRedaction");
if (markRedaction) {
 markRedaction.onclick = () => {
 redactionTexts.forEach((text) => {
  instance.createRedactionsBySearch(text, {
  searchInAnnotations: false,
  });
 });
 };
}
const addAutoRedaction = document.getElementById("addRedactionsButton");
/*if (addAutoRedaction) {
 addAutoRedaction.onclick = () => {
 if (!uploadedJsonData) {
 alert("Please upload a JSON file first.");
 return;
 }
 uploadedJsonData.forEach((entry: { page: number; coordinates: { Left: number; Top: number; Width: number; Height: number; }; }) => {
 const pageIndex = entry.page - 1; // Convert to 0-based index
 const pageInfo = instance.pageInfoForIndex(pageIndex);
 const pageWidth = pageInfo.width;
 const pageHeight = pageInfo.height;
 const redactionCoords = {
 pageIndex,
 left: entry.coordinates.Left * pageWidth,
 top: entry.coordinates.Top * pageHeight, // Flip Y-axis
 width: entry.coordinates.Width * pageWidth,
 height: entry.coordinates.Height * pageHeight,
 };
 createRedactionFromCoordinates(
 redactionCoords.pageIndex,
 redactionCoords.left,
 redactionCoords.top,
 redactionCoords.width,
 redactionCoords.height
 );
 });
 console.log("Redactions applied from JSON file.");
 alert("Redactions applied successfully!");
 };
}*/
let addAutoRedactionEnable = false;
if (addAutoRedaction) {
 addAutoRedaction.onclick = async () => {
 addAutoRedactionEnable = true;
 if (!uploadedJsonData) {
  alert("Please upload a JSON file first.");
  return;
 }
 for (const entry of uploadedJsonData) {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Delay of 1 second
  const pageIndex = entry.page - 1; // Convert to 0-based index
  const category = entry.category;
  const totalPages = instance.totalPageCount;
  if (pageIndex >= totalPages || pageIndex < 0) {
  console.warn(`Skipping invalid page index: ${pageIndex}`);
  continue;
  }
  const pageInfo = instance.pageInfoForIndex(pageIndex);
  const pageWidth = pageInfo.width;
  const pageHeight = pageInfo.height;
  const redactionCoords = {
  pageIndex,
  left: entry.coordinates.Left * pageWidth,
  top: entry.coordinates.Top * pageHeight, // Flip Y-axis
  width: entry.coordinates.Width * pageWidth,
  height: entry.coordinates.Height * pageHeight,
  };
  createRedactionFromCoordinates(
  redactionCoords.pageIndex,
  redactionCoords.left,
  redactionCoords.top,
  redactionCoords.width,
  redactionCoords.height,
  category
  );
  console.log(`Redaction applied to page ${entry.page}`);
 }
 setTimeout(() => {
  alert("Redactions applied successfully!");
 }, 20);
 addAutoRedactionEnable = false;
 };
}
const fileInputJson = document.getElementById("fileInputJson");
if (fileInputJson) {
 fileInputJson.addEventListener("change", async (event: Event) => {
 const file = (event.target as HTMLInputElement).files?.[0];
 if (file) {
  const reader = new FileReader();
  reader.onload = (e) => {
  try {
   uploadedJsonData = JSON.parse(e.target?.result as string);
   console.log("JSON Data Loaded:", uploadedJsonData);
   alert(
   "JSON file uploaded! Click 'Add Automatic Coordinates Redactions' to apply."
   );
  } catch (error) {
   console.error("Invalid JSON format", error);
   alert("Failed to parse JSON file.");
  }
  };
  reader.readAsText(file);
 }
 });
}
const fileInput = document.getElementById("fileInput");
if (fileInput) {
 fileInput.addEventListener("change", async (event: Event) => {
 const target = event.target as HTMLInputElement;
 if (target && target.files && target.files.length > 0) {
  const viewerContainer = document.getElementById("viewer-container");
  if (viewerContainer) {
  if (instance) {
   PSPDFKit.unload(instance);
   instance = null;
   const parent = document.getElementById("text-container");
   if (parent) {
   parent.innerHTML = "";
   }
  } else {
   PSPDFKit.unload(viewerContainer);
   const parent = document.getElementById("text-container");
   if (parent) {
   parent.innerHTML = "";
   }
  }
  }
  if (objectUrl) {
  URL.revokeObjectURL(objectUrl);
  }
  objectUrl = URL.createObjectURL(target.files[0]);
  load(objectUrl);
 }
 });
}

// Initialize the ViewState
let viewState = new PSPDFKit.ViewState({
  scrollMode: PSPDFKit.ScrollMode.CONTINUOUS, // or PSPDFKit.ScrollMode.CONTINUOUS
});

function load(pdfDocument: string) {
 console.log(`Loading ${pdfDocument}...`); // Apply flexbox to create the layout
 document.body.style.display = "flex";
 document.body.style.flexDirection = "row";
 document.body.style.margin = "0";
 document.body.style.padding = "0";
 document.body.appendChild(viewerContainer);
 PSPDFKit.load({
 document: pdfDocument,
 container: viewerContainer,
 initialViewState: viewState,
 baseUrl: "",
 toolbarItems: [
  {
  type: "redact-rectangle",
  className: "redactRectangle",
  },
  {
  type: "custom",
  id: "apply-redactions",
  title: "Apply All Redactions",
  className: "applyRedactions",
  onPress: () => {
   console.log("Applying redactions...");
   instance.applyRedactions();
   const parent = document.getElementById("text-container");
   if (parent) {
   parent.innerHTML = "";
   }
  },
  },
  {
  type: "export-pdf",
  title: "Download",
  icon: null,
  },
 ],
 styleSheets: ["index.css"],
 })
 .then((_instance) => {
  instance = _instance;
  _instance.addEventListener("annotations.change", () => {
  console.log(`${pdfDocument} loaded!`);
  });
  _instance.setViewState((viewState) =>
  viewState.set("keepSelectedTool", true)
  ); // Set up redaction event listener
  _instance.addEventListener(
  "annotations.create",
  async (createdAnnotations) => {
   console.log("Annotations created", createdAnnotations);
   for (const annotation of createdAnnotations) {
   if (
    annotation instanceof PSPDFKit.Annotations.RedactionAnnotation
   ) {
    addTextElement(annotation);
   }
   }
  }
  );
 })
 .catch(console.error);
}
/*async function addTextElement(annotation: {
 id: any;
 pageIndex: any;
 boundingBox: any;
}) {
 const text = await instance.getMarkupAnnotationText(annotation);
 const redactionId = annotation.id;
 const pageIndex = annotation.pageIndex + 1;
 const rect = annotation.boundingBox;
 // Display the extracted text on the left panel
 const textContainer = document.getElementById(
 "text-container"
 ) as HTMLElement;
 if (textContainer) {
 const textElement = document.createElement("div");
 textElement.id = redactionId;
 textElement.style.display = "flex";
 textElement.style.flexDirection = "column";
 textElement.style.padding = "10px"; // Add padding for better spacing
 textElement.style.borderBottom = "1px solid #ccc"; // Optional: Add a bottom border for separation
 // Create a container for text and trash button
 const textAndTrashContainer = document.createElement("div");
 textAndTrashContainer.style.display = "flex";
 textAndTrashContainer.style.justifyContent = "space-between"; // Space between text and trash button
 textAndTrashContainer.style.alignItems = "center"; // Align items vertically centered
 textAndTrashContainer.style.width = "100%"; // Use full width
 const textNode = document.createElement("span");
 //textNode.textContent = text;
 textNode.textContent = `Page ${pageIndex}: ${text}`;
 textNode.style.flexGrow = "1"; // Allow text to take available space
 textNode.style.marginRight = "10px"; // Add margin to separate text from the button
 const trashButton = document.createElement("button");
 trashButton.innerHTML = '<i class="fas fa-trash"></i>';
 trashButton.className = "trash-button";
 trashButton.style.cursor = "pointer";
 trashButton.style.border = "none"; // Remove default button border
 trashButton.style.background = "none"; // Remove default button background
 trashButton.style.padding = "0"; // Remove padding
 trashButton.style.marginLeft = "10px"; // Add margin for spacing
 trashButton.addEventListener("click", async (e) => {
 e.stopPropagation();
 await handleTrashClick(textElement.id);
 });
 textAndTrashContainer.appendChild(textNode);
 textAndTrashContainer.appendChild(trashButton);
 textElement.appendChild(textAndTrashContainer);
 // Comment container
 const commentContainer = document.createElement("div");
 commentContainer.style.display = "none"; // Initially hidden
 commentContainer.style.marginTop = "5px";
 commentContainer.style.width = "100%";
 const commentInput = document.createElement("textarea"); // Changed to textarea for multiline input
 commentInput.placeholder = "Enter comment...";
 commentInput.style.width = "100%"; // Full width
 commentInput.style.minHeight = "50px"; // Minimum height
 commentInput.style.height = "auto"; // Allow height to adjust
 commentInput.style.padding = "5px";
 commentInput.style.resize = "none"; // Prevent resizing
 commentInput.style.overflowWrap = "break-word"; // Allow text to break to the next line
 let lastSavedComment = ""; // Store the last saved comment
 // Prevent `textElement` click from stealing focus
 commentInput.addEventListener("click", (e) => {
 e.stopPropagation();
 });
 // Save button
 const saveButton = document.createElement("button");
 saveButton.textContent = "Save";
 saveButton.style.cursor = "pointer";
 saveButton.style.display = "none"; // Initially hidden
 saveButton.style.marginTop = "5px"; // Add margin for spacing
 saveButton.addEventListener("click", () => {
 lastSavedComment = commentInput.value; // Save the current input value
 saveButton.style.display = "none"; // Hide save button after saving
 console.log("Comment saved:", lastSavedComment); // Optional: Log the saved comment
 });
 // Input event for comment input
 commentInput.addEventListener("input", (event) => {
 event.stopPropagation();
 if (commentInput.value !== lastSavedComment) {
 saveButton.style.display = "block"; // Show save button if there are changes
 } else {
 saveButton.style.display = "none"; // Hide save button if no changes
 }
 });
 commentContainer.appendChild(commentInput);
 commentContainer.appendChild(saveButton);
 // Toggle button
 const toggleButton = document.createElement("button");
 toggleButton.innerHTML = '<i class="fas fa-comment"></i>'; // Add comment symbol
 toggleButton.style.marginTop = "5px";
 toggleButton.style.cursor = "pointer";
 toggleButton.style.alignSelf = "flex-start"; // Align the toggle button to the left
 toggleButton.addEventListener("click", (e) => {
 e.stopPropagation(); // Prevent unwanted propagation
 if (commentContainer.style.display === "none") {
 commentContainer.style.display = "block";
 commentInput.value = lastSavedComment; // Restore the last saved comment
 saveButton.style.display = "none"; // Hide save button when opening
 } else {
 commentContainer.style.display = "none";
 }
 });
 // Append elements
 textElement.appendChild(toggleButton); // Move toggle button below the text and trash
 textElement.appendChild(commentContainer); // Append comment container below the toggle button
 // Add click event listener to the text element
 textElement.style.cursor = "pointer";
 textElement.addEventListener("click", (e: MouseEvent) => {
 selectAnnotationById(redactionId, pageIndex-1, rect);
 e.stopPropagation();
 // Remove highlight from the previously highlighted element
 if (highlightedElement) {
 highlightedElement.classList.remove("highlight");
 }
 // Highlight the clicked text element
 highlightedElement = textElement;
 highlightedElement.classList.add("highlight");
 });
 textContainer.appendChild(textElement);
 textContainer.scrollTop = textContainer.scrollHeight;
 }
}*/
async function addTextElement(annotation: {
 id: any;
 pageIndex: any;
 boundingBox: any;
 customData: any;
}) {
 const text = await instance.getMarkupAnnotationText(annotation);
 const redactionId = annotation.id;
 const pageIndex = annotation.pageIndex + 1;
 const rect = annotation.boundingBox;
 console.log("cusotm:", annotation.customData); // Get the text container
 const textContainer = document.getElementById(
 "text-container"
 ) as HTMLElement;
 if (!textContainer) return; // Create new text element
 const textElement = document.createElement("div");
 textElement.id = redactionId;
 textElement.style.display = "flex";
 textElement.style.flexDirection = "column";
 textElement.style.padding = "10px";
 textElement.style.borderBottom = "1px solid #ccc"; // Container for text and trash button
 const textAndTrashContainer = document.createElement("div");
 textAndTrashContainer.style.display = "flex";
 textAndTrashContainer.style.justifyContent = "space-between";
 textAndTrashContainer.style.alignItems = "center";
 textAndTrashContainer.style.width = "100%";
 const textNode = document.createElement("span");
 textNode.textContent = `Page ${pageIndex}: ${text}`;
 textNode.style.flexGrow = "1";
 textNode.style.marginRight = "10px";
 const trashButton = document.createElement("button");
 trashButton.innerHTML = '<i class="fas fa-trash"></i>';
 trashButton.className = "trash-button";
 trashButton.style.cursor = "pointer";
 trashButton.style.border = "none";
 trashButton.style.background = "none";
 trashButton.style.padding = "0";
 trashButton.style.marginLeft = "10px";
 trashButton.addEventListener("click", async (e) => {
 e.stopPropagation();
 await handleTrashClick(textElement.id);
 });
 textAndTrashContainer.appendChild(textNode);
 textAndTrashContainer.appendChild(trashButton);
 textElement.appendChild(textAndTrashContainer); // Comment container
 const commentContainer = document.createElement("div");
 commentContainer.style.display = "block"; // Initially hidden
 commentContainer.style.marginTop = "5px";
 commentContainer.style.width = "100%";
 const commentInput = document.createElement("textarea"); // Changed to textarea for multiline input
 commentInput.style.width = "100%"; // Full width
 commentInput.style.minHeight = "50px"; // Minimum height
 commentInput.style.height = "auto"; // Allow height to adjust
 commentInput.style.padding = "5px";
 commentInput.style.resize = "none"; // Prevent resizing
 commentInput.style.overflowWrap = "break-word"; // Allow text to break to the next line
 //let lastSavedComment = ""; // Store the last saved comment
 // Prevent `textElement` click from stealing focus
 /*commentInput.addEventListener("click", (e) => {
 e.stopPropagation();
 });*/ // Save button
 /*const saveButton = document.createElement("button");
 saveButton.textContent = "Save";
 saveButton.style.cursor = "pointer";
 saveButton.style.display = "none"; // Initially hidden
 saveButton.style.marginTop = "5px"; // Add margin for spacing
 saveButton.addEventListener("click", () => {
 lastSavedComment = commentInput.value; // Save the current input value
 saveButton.style.display = "none"; // Hide save button after saving
 console.log("Comment saved:", lastSavedComment); // Optional: Log the saved comment
 });*/ // Input event for comment input
 /*commentInput.addEventListener("input", (event) => {
 event.stopPropagation();
 if (commentInput.value !== lastSavedComment) {
 saveButton.style.display = "block"; // Show save button if there are changes
 } else {
 saveButton.style.display = "none"; // Hide save button if no changes
 }
 });*/
 commentContainer.appendChild(commentInput); //commentContainer.appendChild(saveButton);
 // Toggle button
 const toggleButton = document.createElement("button");
 toggleButton.innerHTML = '<i class="fas fa-comment"></i>'; // Add comment symbol
 toggleButton.style.marginTop = "5px";
 toggleButton.style.cursor = "pointer";
 toggleButton.style.alignSelf = "flex-start"; // Align the toggle button to the left
 toggleButton.addEventListener("click", (e) => {
 e.stopPropagation(); // Prevent unwanted propagation
 if (commentContainer.style.display === "block") {
  commentContainer.style.display = "none"; //commentInput.value = lastSavedComment; // Restore the last saved comment
  // saveButton.style.display = "none"; // Hide save button when opening
 } else {
  commentContainer.style.display = "block";
 }
 }); // Append elements
 textElement.appendChild(toggleButton); // Move toggle button below the text and trash
 textElement.appendChild(commentContainer); // Append comment container below the toggle button
 if (annotation.customData != null) {
 // Automatically adds comment as category
 commentInput.placeholder = annotation.customData.category;
} else {
 (async function getUserComment() {
   const userComment = prompt("Please enter a comment");
   if (userComment === null || userComment.trim() === "") {
     console.log("User canceled or entered an empty comment. Deleting annotation...");
     await handleTrashClick(textElement.id); // Ensure async behavior
   } else {
     commentInput.placeholder = userComment;
   }
 })(); // Immediately Invoked Function Expression (IIFE) to handle async/await
}
 // Add click event listener to the text element
 textElement.style.cursor = "pointer";
 textElement.addEventListener("click", (e: MouseEvent) => {
 selectAnnotationById(redactionId, pageIndex - 1, rect);
 textElement.scrollIntoView({ behavior: "smooth", block: "center" });
 e.stopPropagation(); // Remove highlight from the previously highlighted element
 if (highlightedElement) {
  highlightedElement.classList.remove("highlight");
 } // Highlight the clicked text element
 highlightedElement = textElement;
 highlightedElement.classList.add("highlight");
 }); // Insert the element at the correct position based on pageIndex
 if (commentInput.placeholder != ""){
 insertInOrder(textContainer, textElement, pageIndex);
 }
 if (!addAutoRedactionEnable) {
 textElement.scrollIntoView({ behavior: "smooth", block: "center" });
 }
 if(instance){
 instance.addEventListener("viewState.currentPageIndex.change", (newPageIndex: any) => {
  console.log("Page changed to:", newPageIndex);
  scrollToPageIndex(newPageIndex + 1);
 });}
} /**
 * Inserts a new element into the container in the correct order based on pageIndex.
 */
function insertInOrder(
 container: HTMLElement,
 newElement: HTMLElement,
 newPageIndex: number
) {
 const elements = Array.from(container.children) as HTMLElement[];
 let inserted = false;
 for (let i = 0; i < elements.length; i++) {
 const existingText = elements[i].querySelector("span")?.textContent ?? "";
 const match = existingText.match(/Page (\d+):/);
 const existingPageIndex = match
  ? parseInt(match[1], 10)
  : Number.MAX_SAFE_INTEGER;
 if (newPageIndex < existingPageIndex) {
  container.insertBefore(newElement, elements[i]);
  inserted = true;
  break;
 }
 } // If no suitable place was found, append at the end
 if (!inserted) {
 container.appendChild(newElement);
 }
}
function scrollToPageIndex(pageIndex: number) {
 const textContainer = document.getElementById("text-container") as HTMLElement;
 if (!textContainer) return;
 const textElements = textContainer.getElementsByTagName("div");
 for (let i = 0; i < textElements.length; i++) {
 const textElement = textElements[i];
 if (textElement.textContent?.includes(`Page ${pageIndex}:`)) {
  textElement.scrollIntoView({ behavior: "smooth", block: "start" });
  break;
 }
 }
}
let lastVisiblePageIndex: number = null;
const textContainer = document.getElementById("text-container") as HTMLElement;
textContainer.addEventListener("scroll", () => {
 const currentTextElement = getLastVisibleTextElement(textContainer);
 if (currentTextElement) {
 const currentPageText = currentTextElement.querySelector("span")?.textContent ?? "";
 const currentPageIndexMatch = currentPageText.match(/Page (\d+):/);
 if (currentPageIndexMatch) {
  const currentPageIndex = parseInt(currentPageIndexMatch[1], 10);
  // Only print if the current page differs from the last visible page
  if (currentPageIndex !== lastVisiblePageIndex) {
  console.log(`Page changed to: ${currentPageIndex} from: ${lastVisiblePageIndex}`);
  instance.setViewState((state: { set: (arg0: string, arg1: number) => any; }) => state.set("currentPageIndex", currentPageIndex-1));
  lastVisiblePageIndex = currentPageIndex;
  }
 }
 }
});
/*function getLastVisibleTextElement(container: HTMLElement) {
 const textElements = container.getElementsByTagName("div");
 let lastVisibleElement: HTMLElement = null;
 // Iterate over all text elements and find the one at the bottom of the container
 for (let i = 0; i < textElements.length; i++) {
 const textElement = textElements[i];
 const rect = textElement.getBoundingClientRect();
 const containerRect = container.getBoundingClientRect();
 // Check if the bottom of the element is within the visible area of the container
 if (rect.top >= containerRect.top && rect.top < containerRect.bottom && rect.bottom <= containerRect.bottom) {
  lastVisibleElement = textElement;
 }
 }
 return lastVisibleElement;
}
*/
function getLastVisibleTextElement(container: HTMLElement) {
const textElements = container.getElementsByTagName("div");
 let firstVisibleElement: HTMLElement = null;
 // Iterate over all text elements and find the one at the top of the container
 for (let i = 0; i < textElements.length; i++) {
 const textElement = textElements[i];
 const rect = textElement.getBoundingClientRect();
 const containerRect = container.getBoundingClientRect();
 // Check if the top of the element is within the visible area of the container
 if (rect.bottom >= containerRect.top && rect.bottom < containerRect.bottom && rect.top >= containerRect.top) {
  firstVisibleElement = textElement;
  break;
 }
 }
 return firstVisibleElement;
}
async function handleTrashClick(annotationId: string) {
 if (instance) {
 const textDiv = document.getElementById(annotationId);
 if (textDiv) {
  textDiv.remove();
 }
 await instance.delete(annotationId);
 }
}
document.addEventListener("click", () => {
 if (highlightedElement) {
 highlightedElement.classList.remove("highlight");
 highlightedElement = null;
 }
});
function selectAnnotationById(
 annotationId: string,
 pageIndex: number,
 rect: any
) {
 instance.jumpToRect(pageIndex, rect);
 setTimeout(() => {
 instance.setSelectedAnnotations(annotationId);
 }, 100);
}
// New function to create redaction from coordinates
function createRedactionFromCoordinates(
 pageIndex: number,
 left: number,
 top: number,
 width: number,
 height: number,
 category: string
) {
 const redaction = new PSPDFKit.Annotations.RedactionAnnotation({
 pageIndex: pageIndex,
 boundingBox: new PSPDFKit.Geometry.Rect({
  left: left,
  top: top,
  width: width,
  height: height,
 }),
 rects: PSPDFKit.Immutable.List([
  new PSPDFKit.Geometry.Rect({
  left: left,
  top: top,
  width: width,
  height: height,
  }),
 ]), // color: PSPDFKit.Color.RED,
 fillColor: PSPDFKit.Color.BLACK, // overlayText: "REDACTED"
 });
 const updatedAnnotaion = redaction.set("customData", { category });
 instance.create(updatedAnnotaion);
}

function rotatePageClockwise() {
  const currentPageIndex = instance.viewState.currentPageIndex;
  instance.applyOperations([
    {
      type: "rotatePages",
      pageIndexes: [currentPageIndex],
      rotateBy: 90 // Rotate 90 degrees clockwise
    }
  ]);
}

// Function to rotate the current page counterclockwise
function rotatePageCounterclockwise() {
  const currentPageIndex = instance.viewState.currentPageIndex;
  instance.applyOperations([
    {
      type: "rotatePages",
      pageIndexes: [currentPageIndex],
      rotateBy: -90 // Rotate 90 degrees counterclockwise
    }
  ]);
}

// Example usage of createRedactionFromCoordinates
// You can call this function with the desired parameters when needed
// createRedactionFromCoordinates(pageIndex, left, top, width, height);
// Load the initial document
load("example.pdf");