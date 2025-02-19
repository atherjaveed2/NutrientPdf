/* eslint-disable @typescript-eslint/no-explicit-any */
import PSPDFKit from "@nutrient-sdk/viewer";

let instance: any = null;
let highlightedElement: HTMLElement | null = null; 
let objectUrl = "";

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
  leftPanel.innerHTML += "<h3>Extracted Text</h3>";
  const textContainer = document.createElement("div");
  textContainer.id = "text-container";
  leftPanel.appendChild(textContainer); 

  // Create a resizer element
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
  leftPanel.appendChild(resizer);

  // Add event listeners for resizing
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
}
createLeftPanel();

// Create the PSPDFKit viewer container on the right
const viewerContainer = document.createElement("div");
viewerContainer.id = "viewer-container";
viewerContainer.classList.add("viewer-container");
viewerContainer.style.flexGrow = "1";

document.body.appendChild(viewerContainer);

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

function load(pdfDocument: string) {
  console.log(`Loading ${pdfDocument}...`);
  
  // Apply flexbox to create the layout
  document.body.style.display = "flex";
  document.body.style.flexDirection = "row"; 
  document.body.style.margin = "0"; 
  document.body.style.padding = "0"; 
  document.body.appendChild(viewerContainer);

  PSPDFKit.load({
    document: pdfDocument,
    container: viewerContainer,
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
        }
      },
      {
        type: "export-pdf",
        title: "Download",
        icon: null,
      },
    ],
    styleSheets: [
      "index.css" 
    ]
  })
  .then((_instance) => {
    instance = _instance;
    _instance.addEventListener("annotations.change", () => {
      console.log(`${pdfDocument} loaded!`);
    });

    _instance.setViewState(viewState => (
      viewState.set("keepSelectedTool", true)
    ));

    // Set up redaction event listener
    _instance.addEventListener("annotations.create", async (createdAnnotations) => {
      console.log("Annotations created", createdAnnotations);
      for (const annotation of createdAnnotations) {
        if (annotation instanceof PSPDFKit.Annotations.RedactionAnnotation) {
          const text = await instance.getMarkupAnnotationText(annotation);
          const redactionId = annotation.id;
          const pageIndex = annotation.pageIndex;
          const rect = annotation.boundingBox;

          // Display the extracted text on the left panel
          const textContainer = document.getElementById("text-container") as HTMLElement;
          if (textContainer) {
            const textElement = document.createElement("div");
            textElement.textContent = text;
            textElement.id = redactionId;
            textElement.style.display = "flex"; 
            textElement.style.justifyContent = "space-between"; 
            textElement.style.alignItems = "center"; 

            const trashButton = document.createElement("button");
            trashButton.innerHTML = '<i class="fas fa-trash"></i>'; 
            trashButton.className = "trash-button"; 
            trashButton.style.cursor = "pointer"; 

            trashButton.addEventListener("click", async (e) => {
              e.stopPropagation();
              await handleTrashClick(textElement.id);
            });

            textElement.appendChild(trashButton);

            // Add click event listener to the text element
            textElement.style.cursor = "pointer"; 
            textElement.addEventListener("click", (e: MouseEvent) => {
              selectAnnotationById(redactionId, pageIndex, rect);
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
        }
      }
    });
  })
  .catch(console.error);
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

function selectAnnotationById(annotationId: string, pageIndex: number, rect: any) {
  instance.jumpToRect(pageIndex, rect);
  setTimeout(() => {
    instance.setSelectedAnnotations(annotationId);
  }, 100);
}

// Load the initial document
load("example.pdf");