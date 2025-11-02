export async function getDocuments() {
  try {
    const response = await fetch("http://localhost:4001/documents", { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

export async function getDocument(id: string) {
  try {
    const response = await fetch(`http://localhost:4001/documents/${id}`, { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

export async function generateDocument(formData: any) {
  try {
    const response = await fetch("http://localhost:4001/documents/generate", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || "Error al generar el documento");
    }

    return data;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
}






