from docx import Document
import sys

def extract_hyperlinks(doc_path):
    doc = Document(doc_path)
    links = []
    
    # Iterate through paragraphs
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            pass # We need to access XML directly because python-docx doesn't easily expose hyperlinks natively in older versions

    # A better way is to parse the document.xml relationships
    rels = doc.part.rels
    for rel_id, rel in rels.items():
        if rel.reltype == 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink':
            print(f"Link: {rel.target_ref}")

if __name__ == '__main__':
    extract_hyperlinks("Mendocino V2.docx")
