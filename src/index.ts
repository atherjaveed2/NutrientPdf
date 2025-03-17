import PSPDFKit, { ViewState } from "@nutrient-sdk/viewer";
let instance: any = null;
let highlightedElement: HTMLElement | null = null;
let objectUrl = "";
let currentZoomPercentage = "100%";
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
}
createLeftPanel();
// Create the PSPDFKit viewer container on the right
const viewerContainer = document.createElement("div");
viewerContainer.id = "viewer-container";
viewerContainer.classList.add("viewer-container");
viewerContainer.style.flexGrow = "1";
document.body.appendChild(viewerContainer);

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
  sidebarMode: PSPDFKit.SidebarMode.THUMBNAILS,
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
    printOptions: {
      quality: PSPDFKit.PrintQuality.HIGH, // Set to MEDIUM or HIGH as needed
    },
    baseUrl: "",
    toolbarItems: [
      {
        type: "sidebar-thumbnails",
      },

      {
        type: "document-editor",
      },
      {
        type: "sidebar-bookmarks",
      },
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

      {
        type: "custom",
        title: "Add Notes",
        onPress: () => {
          // Toggle the sidebar visibility
          instance.setViewState(
            (viewState: {
              sidebarMode: string;
              set: (arg0: string, arg1: string) => any;
            }) => {
              // Check if the sidebar is already showing the custom mode
              const isCustomSidebarVisible =
                viewState.sidebarMode === PSPDFKit.SidebarMode.CUSTOM;

              // If it's visible, hide it by setting to null
              // If it's hidden, show it by setting to CUSTOM
              return viewState.set(
                "sidebarMode",
                isCustomSidebarVisible ? null : PSPDFKit.SidebarMode.CUSTOM
              );
            }
          );
        },
      },

      //  {
      //  type: "zoom-in", // Use custom type if "zoom-in" is not predefined
      //  id: "zoom-in-button", // Unique identifier for the custom item
      //  title: "Zoom In", // Title displayed on the button
      //  onPress: () => {
      //   console.log("Zooming in...");
      //   instance.setViewState((viewState: { zoomIn: () => any; }) => viewState.zoomIn());
      //  }
      //  },
      //  {
      //  type: "zoom-out", // Use custom type if "zoom-in" is not predefined
      //  id: "zoom-out-button", // Unique identifier for the custom item
      //  title: "Zoom Out", // Title displayed on the button
      //  onPress: () => {
      //   console.log("Zooming out...");
      //   instance.setViewState((viewState: { zoomOut: () => any; }) => viewState.zoomOut());
      //  }
      //  },
      //  {
      //  type: "custom", // Use custom type for the rotation button
      //  id: "rotate-page-counterclockwise-button", // Unique identifier for the custom item
      //  title: "Rotate Left", // Title displayed on the button
      //  onPress: () => {
      //   console.log("Rotating page counter-clockwise...");
      //   instance.applyOperations([
      //   {
      //    type: "rotatePages", // Operation type for rotating pages
      //    pageIndexes: [0], // Example: Rotate the first page
      //    rotateBy: -90 // Rotate 90 degrees counter-clockwise
      //   }
      //   ]);
      //  }
      //  },
      //  {
      //  type: "custom", // Use custom type for the rotation button
      //  id: "rotate-page-button", // Unique identifier for the custom item
      //  title: "Rotate Right", // Title displayed on the button
      //  onPress: () => {
      //   console.log("Rotating page...");
      //   const currentViewState = instance.viewState;
      //   instance.applyOperations([
      //   {
      //    type: "rotatePages", // Operation type for rotating pages
      //    pageIndexes: [currentViewState.currentPageIndex], // Example: Rotate the first page
      //    rotateBy: 90 // Rotate 90 degrees clockwise
      //   }
      //   ]);
      //  }
      //  },
      //  {
      //  type: "custom",
      //  id: "toggle-view-mode-button",
      //  title: "Toggle View Mode Off", // Initial title
      //  onPress: () => {
      //   console.log("Toggling view mode...");
      //   // Get the current view state
      //   const currentViewState = instance.viewState;
      //   // Determine the current scroll mode
      //   const currentScrollMode = currentViewState.scrollMode;
      //   // Toggle the scroll mode
      //   const newScrollMode = currentScrollMode === PSPDFKit.ScrollMode.CONTINUOUS
      //   ? PSPDFKit.ScrollMode.PER_SPREAD
      //   : PSPDFKit.ScrollMode.CONTINUOUS;
      //   // Keep the current page index and zoom level
      //   const currentPageIndex = currentViewState.currentPageIndex;
      //   const zoomLevel = currentViewState.zoomLevel;
      //   // Update the view state with the new scroll mode, lock to the current page, and set the zoom level
      //   const newViewState = currentViewState
      //   .set("scrollMode", newScrollMode)
      //   .set("currentPageIndex", currentPageIndex)
      //   .set("zoomLevel", zoomLevel);
      //   // Update the viewer with the new view state
      //   instance.setViewState(newViewState);
      //   // Toggle the button title
      //   const newTitle = newScrollMode === PSPDFKit.ScrollMode.CONTINUOUS
      //   ? "Toggle View Mode Off"
      //   : "Toggle View Mode On";
      //   // Update the toolbar item with the new title
      //   instance.setToolbarItems((prevItems: any[]) =>
      //   prevItems.map(item =>
      //    item.id === "toggle-view-mode-button"
      //    ? { ...item, title: newTitle }
      //    : item
      //   )
      //   );
      //  }
      //  },
      {
        type: "print", // Use custom type for the print button
        id: "print-pdf-button", // Unique identifier for the custom item
        title: "Print PDF", // Title displayed on the button
        onPress: () => {
          console.log("Printing PDF...");
          instance.print(); // Call the print method to open the print dialog
        },
      },
      {
        type: "pager",
      },

      {
        type: "custom",
        id: "zoom-dropdown-button",
        title: currentZoomPercentage, // Use the string directly
        dropdownGroup: "zoom-options",
        onPress: () => {
          console.log("Zoom dropdown clicked");
        },
      },
      {
        type: "custom",
        id: "fit-width-button",
        title: "Fit Width",
        dropdownGroup: "zoom-options",
        onPress: () => {
          instance.setViewState(
            new PSPDFKit.ViewState({
              zoom: PSPDFKit.ZoomMode.FIT_TO_WIDTH,
            })
          );
          setTimeout(updateZoomPercentage, 100); // Allow time for zoom to update
        },
      },
      {
        type: "custom",
        id: "fit-page-button",
        title: "Fit Page",
        dropdownGroup: "zoom-options",
        onPress: () => {
          instance.setViewState(
            new PSPDFKit.ViewState({
              zoom: PSPDFKit.ZoomMode.FIT_TO_VIEWPORT,
            })
          );
          setTimeout(updateZoomPercentage, 100); // Allow time for zoom to update
        },
      },
      {
        type: "custom",
        id: "fit-100-button",
        title: "Fit 100%",
        dropdownGroup: "zoom-options",
        onPress: () => {
          instance.setViewState(
            new PSPDFKit.ViewState({
              zoom: 1,
            })
          );
          updateZoomPercentage(); // Update the zoom percentage immediately
        },
      },
    ],

    documentEditorToolbarItems: PSPDFKit.defaultDocumentEditorToolbarItems.map(
      (item) =>
        item.type === "remove"
          ? {
              type: "custom",
              id: "custom-delete",
              title: "Mark as Deleted",
              onPress: (
                event: MouseEvent | KeyboardEvent,
                documentEditorUIHandler: any,
                id: string
              ) => {
                const selectedPageIndexes =
                  documentEditorUIHandler.getSelectedPageIndexes();

                const pageElements = instance.contentDocument.querySelectorAll(
                  ".PSPDFKit-DocumentEditor-Thumbnails-Page-Image.PSPDFKit-DocumentEditor-Page"
                );

                selectedPageIndexes.forEach((pageIndex: number) => {
                  if (pageIndex < pageElements.length) {
                    const pageElement = pageElements[pageIndex];
                    pageElement.classList.add("page-strike-through");
                    console.log(
                      `Strike-through effect applied to page ${pageIndex}`
                    );
                  } else {
                    console.log(`Page index ${pageIndex} is out of range`);
                  }
                });

                // Provide feedback to the user
              },
            }
          : item
    ),

    documentEditorFooterItems: PSPDFKit.defaultDocumentEditorFooterItems.map(
      (item) =>
        item.type === "save"
          ? {
              type: "custom",
              id: "custom-save",
              title: "Save and Delete Marked Pages",
              node: document.createElement("button"),
              onPress: async (
                event: MouseEvent | KeyboardEvent,
                documentEditorUIHandler: any,
                id: string
              ) => {
                if (!instance || !instance.contentDocument) {
                  alert("Unable to save document. Please try again.");
                  return;
                }

                try {
                  // Show a loading indicator
                  //   documentEditorUIHandler.showLoadingIndicator();

                  const strikedPages = Array.from(
                    instance.contentDocument.querySelectorAll(
                      ".page-strike-through"
                    )
                  ) as Element[];
                  const pagesToRemove = strikedPages
                    .map((page) =>
                      Array.from(page.parentNode?.children || []).indexOf(page)
                    )
                    .filter(
                      (index) => index >= 0 && index < instance.totalPageCount
                    );

                  if (pagesToRemove.length === 0) {
                    alert("No pages marked for deletion.");
                    return;
                  }

                  // Sort page indices in descending order
                  let pagesToRemoveArray = [...pagesToRemove].sort(
                    (a, b) => b - a
                  );

                  // Remove pages one by one, starting from the highest index
                  for (const pageIndex of pagesToRemoveArray) {
                    await instance.applyOperations([
                      {
                        type: "removePages",
                        pageIndexes: [pageIndex],
                      },
                    ]);
                  }

                  //   await instance.applyOperations([
                  //     {
                  //       type: 'removePages',
                  //       pageIndexes: pagesToRemove
                  //     }
                  //   ]);

                  const pdfData = await instance.exportPDF();

                  // Here you can save the pdfData to a file or send it to a server
                  console.log("PDF exported with deleted pages");
                  alert(
                    "Document saved successfully with marked pages removed."
                  );
                } catch (error) {
                  console.error("Error saving document:", error);
                  if (error instanceof Error) {
                    console.error("Error name:", error.name);
                    console.error("Error message:", error.message);
                    console.error("Error stack:", error.stack);
                  }
                  alert(
                    "An error occurred while saving the document. Please check the console for more details."
                  );
                } finally {
                  // Hide the loading indicator
                  //   documentEditorUIHandler.hideLoadingIndicator();
                }
              },
            }
          : item
    ) as any,

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

      _instance.setCustomUIConfiguration((customUIConfiguration: any) => ({
        ...customUIConfiguration,
        [PSPDFKit.UIElement.Sidebar]: {
          [PSPDFKit.SidebarMode.CUSTOM](payload: {
            containerNode: HTMLElement;
          }) {
            const { containerNode } = payload;

            // Set the width of the sidebar container
            containerNode.style.width = "300px";
            containerNode.style.maxWidth = "300%";
            containerNode.style.overflow = "auto";

            // Create a notes container
            const notesContainer = document.createElement("div");
            notesContainer.className = "custom-notes-container";
            notesContainer.style.padding = "10px";

            // Add a title
            // const title = document.createElement('h3');
            // title.textContent = 'Document Notes';
            // notesContainer.appendChild(title);

            const titleCard = document.createElement("div");
            titleCard.className = "custom-title-card";
            titleCard.style.backgroundColor = "#f5f5f5";
            titleCard.style.padding = "12px";
            titleCard.style.borderRadius = "4px";
            titleCard.style.marginBottom = "15px";
            titleCard.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            titleCard.style.fontWeight = "bold";
            titleCard.style.fontSize = "16px";
            titleCard.textContent = "Document Notes";
            notesContainer.appendChild(titleCard);

            // Add "Add Document Note" button at the top
            const addButton = document.createElement("button");
            addButton.textContent = "Add Document Note";
            addButton.className = "PSPDFKit-Sidebar-Bookmarks-Button-Add"; // Using bookmark button styling
            addButton.style.width = "100%";
            addButton.style.padding = "8px";
            addButton.style.marginBottom = "10px";

            // Store notes in an array (you might want to persist this)
            const notes: { pageIndex: number; text: string }[] = [];
            const renderNotes = () => {
              // Clear existing notes from the DOM
              while (notesContainer.querySelector(".custom-note")) {
                notesContainer.querySelector(".custom-note").remove();
              }
      
              // Get today's date in a readable format
              const today = new Date();
              const formattedDate = today.toLocaleDateString();

              // Render each note
              notes.forEach((note, index) => {
                const noteElement = document.createElement("div");
                noteElement.className = "custom-note";

                // Apply card-like styling
                noteElement.style.backgroundColor = "#f5f5f5";
                noteElement.style.padding = "12px";
                noteElement.style.borderRadius = "4px";
                noteElement.style.marginBottom = "10px";
                noteElement.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                noteElement.style.cursor = "pointer";
                noteElement.style.position = "relative";
                noteElement.style.paddingBottom = "40px"; // Add padding at bottom for buttons

                // Create header section with page number and date
                const headerSection = document.createElement("div");
                headerSection.style.display = "flex";
                headerSection.style.justifyContent = "space-between";
                headerSection.style.marginBottom = "5px";

                const pageLabel = document.createElement("div");
                pageLabel.className = "PSPDFKit-Sidebar-Bookmarks-Page-Number";
                pageLabel.textContent = `Page ${note.pageIndex + 1}`;
                pageLabel.style.fontWeight = "bold";

                const dateLabel = document.createElement("div");
                dateLabel.className = "note-date";
                dateLabel.textContent = formattedDate;
                dateLabel.style.fontSize = "12px";
                dateLabel.style.color = "#666";

                headerSection.appendChild(pageLabel);
                headerSection.appendChild(dateLabel);

                // Create note text element (initially not editable)
                const noteText = document.createElement("div");
                noteText.className = "PSPDFKit-Sidebar-Bookmarks-Name";
                noteText.textContent = note.text;
                noteText.style.marginBottom = "10px";

                // Create a button container for the bottom right
                const buttonContainer = document.createElement("div");
                buttonContainer.style.position = "absolute";
                buttonContainer.style.bottom = "10px";
                buttonContainer.style.right = "10px";
                buttonContainer.style.display = "flex";
                buttonContainer.style.gap = "5px";

                // Add edit button
                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.className = "PSPDFKit-Sidebar-Bookmarks-Button-Save"; // Using bookmark save button styling
                
                // Create a function for the edit button click handler
                const handleEditClick = (e: Event) => {
                  e.stopPropagation(); // Prevent navigation when clicking edit

                  // Switch to edit mode
                  const textArea = document.createElement("textarea");
                  textArea.className = "PSPDFKit-Sidebar-Bookmarks-Editor";
                  textArea.value = note.text;
                  textArea.style.width = "100%";
                  textArea.style.minHeight = "60px";
                  textArea.style.border = "1px solid #ccc";
                  textArea.style.borderRadius = "3px";
                  textArea.style.padding = "5px";
                  textArea.style.marginBottom = "10px";
                  textArea.style.resize = "vertical";

                  // Replace the text div with textarea
                  noteElement.replaceChild(textArea, noteText);
                  textArea.focus();

                  // Change edit button to save button
                  editButton.textContent = "Save";
                  
                  // Remove the edit click handler
                  editButton.removeEventListener("click", handleEditClick);
                  
                  // Add the save click handler
                  const handleSaveClick = (e: Event) => {
                    e.stopPropagation();
                    const newText = textArea.value.trim();
                    if (newText) {
                      notes[index].text = newText;
                      // Instead of trying to manipulate the DOM directly,
                      // just update the data and re-render everything
                      renderNotes();
                    }
                  };
                  
                  editButton.addEventListener("click", handleSaveClick);
      
                  // Add cancel button
                  const cancelButton = document.createElement("button");
                  cancelButton.textContent = "Cancel";
                  cancelButton.className = "PSPDFKit-Sidebar-Bookmarks-Button-Delete";
                  cancelButton.style.marginRight = "5px";
                  
                  cancelButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    renderNotes(); // Just re-render to cancel editing
                  });

                  // Add cancel button before edit button
                  buttonContainer.insertBefore(cancelButton, editButton);
                };
                
                // Add the edit click handler
                editButton.addEventListener("click", handleEditClick);
      
                // Add delete button
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.className =
                  "PSPDFKit-Sidebar-Bookmarks-Button-Delete";
                deleteButton.addEventListener("click", (e) => {
                  e.stopPropagation(); // Prevent navigation when clicking delete
                  notes.splice(index, 1);
                  renderNotes();
                });

                // Add click handler to navigate to the page
                noteElement.addEventListener("click", () => {
                  _instance.setViewState((viewState: any) =>
                    viewState.set("currentPageIndex", note.pageIndex)
                  );
                });

                // Append buttons to the button container
                buttonContainer.appendChild(editButton);
                buttonContainer.appendChild(deleteButton);

                // Append elements to the note card
                noteElement.appendChild(headerSection);
                noteElement.appendChild(noteText);
                noteElement.appendChild(buttonContainer);
                notesContainer.appendChild(noteElement);
              });
            };

            // Modify the add button click handler to create an editable card instead of showing a prompt
            addButton.addEventListener("click", () => {
              // Get current page index
              const currentPageIndex = _instance.viewState.currentPageIndex;

              // Create a temporary editable note card
              const editableNoteCard = document.createElement("div");
              editableNoteCard.className = "custom-note";
              editableNoteCard.style.backgroundColor = "#f5f5f5";
              editableNoteCard.style.padding = "12px";
              editableNoteCard.style.borderRadius = "4px";
              editableNoteCard.style.marginBottom = "10px";
              editableNoteCard.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

              // Get today's date
              const today = new Date();
              const formattedDate = today.toLocaleDateString();

              // Create header section with page number and date
              const headerSection = document.createElement("div");
              headerSection.style.display = "flex";
              headerSection.style.justifyContent = "space-between";
              headerSection.style.marginBottom = "5px";

              const pageLabel = document.createElement("div");
              pageLabel.className = "PSPDFKit-Sidebar-Bookmarks-Page-Number";
              pageLabel.textContent = `Page ${currentPageIndex + 1}`;
              pageLabel.style.fontWeight = "bold";

              const dateLabel = document.createElement("div");
              dateLabel.className = "note-date";
              dateLabel.textContent = formattedDate;
              dateLabel.style.fontSize = "12px";
              dateLabel.style.color = "#666";

              headerSection.appendChild(pageLabel);
              headerSection.appendChild(dateLabel);

              // Create editable text area
              const textArea = document.createElement("textarea");
              textArea.className = "PSPDFKit-Sidebar-Bookmarks-Name";
              textArea.style.width = "100%";
              textArea.style.minHeight = "60px";
              textArea.style.border = "1px solid #ccc";
              textArea.style.borderRadius = "3px";
              textArea.style.padding = "5px";
              textArea.style.marginBottom = "10px";
              textArea.style.resize = "vertical";
              textArea.placeholder = "Enter your note here...";
              textArea.focus(); // Auto-focus the textarea

              // Create button container
              const buttonContainer = document.createElement("div");
              buttonContainer.style.display = "flex";
              buttonContainer.style.justifyContent = "flex-end";
              buttonContainer.style.gap = "5px";

              // Save button
              const saveButton = document.createElement("button");
              saveButton.textContent = "Save";
              saveButton.className = "PSPDFKit-Sidebar-Bookmarks-Button-Save";
              saveButton.addEventListener("click", () => {
                const noteText = textArea.value.trim();
                if (noteText) {
                  // Add the new note
                  notes.push({
                    pageIndex: currentPageIndex,
                    text: noteText,
                  });

                  // Remove the editable card and re-render all notes
                  if (notesContainer.contains(editableNoteCard)) {
                    notesContainer.removeChild(editableNoteCard);
                  }
                  renderNotes();
                }
              });

              // Cancel button
              const cancelButton = document.createElement("button");
              cancelButton.textContent = "Cancel";
              cancelButton.className =
                "PSPDFKit-Sidebar-Bookmarks-Button-Delete";
              cancelButton.addEventListener("click", () => {
                // Just remove the editable card
                notesContainer.removeChild(editableNoteCard);
              });

              // Append buttons to container
              buttonContainer.appendChild(cancelButton);
              buttonContainer.appendChild(saveButton);

              // Assemble the editable note card
              editableNoteCard.appendChild(headerSection);
              editableNoteCard.appendChild(textArea);
              editableNoteCard.appendChild(buttonContainer);

              // Insert the editable card at the top of the notes list (after the add button)
              notesContainer.insertBefore(
                editableNoteCard,
                addButton.nextSibling
              );
            });

            notesContainer.appendChild(addButton);
            containerNode.appendChild(notesContainer);

            // Initial render of notes
            renderNotes();

            return {
              node: containerNode,
            };
          },
        },
      }));

      // Show the custom sidebar
      //   _instance.setViewState((viewState: any) =>
      //     viewState.set("sidebarMode", PSPDFKit.SidebarMode.CUSTOM)
      //   );
    })
    .catch(console.error);
}

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
        console.log(
          "User canceled or entered an empty comment. Deleting annotation..."
        );
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
  if (commentInput.placeholder != "") {
    insertInOrder(textContainer, textElement, pageIndex);
  }
  if (!addAutoRedactionEnable) {
    textElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (instance) {
    instance.addEventListener(
      "viewState.currentPageIndex.change",
      (newPageIndex: any) => {
        console.log("Page changed to:", newPageIndex);
        scrollToPageIndex(newPageIndex + 1);
      }
    );
  }
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
  const textContainer = document.getElementById(
    "text-container"
  ) as HTMLElement;
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
    const currentPageText =
      currentTextElement.querySelector("span")?.textContent ?? "";
    const currentPageIndexMatch = currentPageText.match(/Page (\d+):/);
    if (currentPageIndexMatch) {
      const currentPageIndex = parseInt(currentPageIndexMatch[1], 10);
      // Only print if the current page differs from the last visible page
      if (currentPageIndex !== lastVisiblePageIndex) {
        console.log(
          `Page changed to: ${currentPageIndex} from: ${lastVisiblePageIndex}`
        );
        instance.setViewState(
          (state: { set: (arg0: string, arg1: number) => any }) =>
            state.set("currentPageIndex", currentPageIndex - 1)
        );
        lastVisiblePageIndex = currentPageIndex;
      }
    }
  }
});
function getLastVisibleTextElement(container: HTMLElement) {
  const textElements = container.getElementsByTagName("div");
  let firstVisibleElement: HTMLElement = null;
  // Iterate over all text elements and find the one at the top of the container
  for (let i = 0; i < textElements.length; i++) {
    const textElement = textElements[i];
    const rect = textElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // Check if the top of the element is within the visible area of the container
    if (
      rect.bottom >= containerRect.top &&
      rect.bottom < containerRect.bottom &&
      rect.top >= containerRect.top
    ) {
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

function updateZoomPercentage() {
  const zoomLevel = instance.viewState.zoomLevel; // Get the current zoom level
  const zoomMode = instance.viewState.zoomMode; // Get the current zoom mode

  if (zoomMode === PSPDFKit.ZoomMode.FIT_TO_WIDTH) {
    currentZoomPercentage = "Fit Width";
  } else if (zoomMode === PSPDFKit.ZoomMode.FIT_TO_VIEWPORT) {
    currentZoomPercentage = "Fit Page";
  } else {
    currentZoomPercentage = Math.round(zoomLevel * 100) + "%"; // Convert zoom level to percentage
  }

  // Update the title of the zoom dropdown button
  instance.setToolbarItems((prevItems: any[]) =>
    prevItems.map((item) =>
      item.id === "zoom-dropdown-button"
        ? { ...item, title: currentZoomPercentage }
        : item
    )
  );
}

load("example.pdf");