import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import customtkinter as ctk

# Connect to the database or create one
def create_database():
    conn = sqlite3.connect(r'D:\EJIE SCHOOLING\CLASSES\5th year\Thesis\Scanseta_Collab\Scanseta\Back_end\medicine_infos.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            generic_name TEXT NOT NULL,
            information TEXT NOT NULL,
            usage TEXT NOT NULL,
            complication TEXT NOT NULL,
            warning TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

create_database()

# Main application
class ManagementApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Medicine Management System")

        # Set a larger size for the window
        window_width = 1100  # Set the window width to a larger size
        window_height = 700  # Set the window height to a larger size

        # Get screen width and height to center the window
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        # Calculate position for centering the window
        x = (screen_width // 2) - (window_width // 2)
        y = (screen_height // 2) - (window_height // 2)

        # Set the window geometry to be centered
        self.root.geometry(f"{window_width}x{window_height}+{x}+{y}")

        # Configure window and add a frame for layout
        self.frame = ctk.CTkFrame(self.root, fg_color="#222f34")  # Set the background color here
        self.frame.pack(fill=tk.BOTH, expand=True)



        # Search frame
        search_frame =  ctk.CTkFrame(self.frame, fg_color="#091d28" , corner_radius=10)  # Optional background color for the search frame
        search_frame.pack(pady=10, padx=20, fill=tk.X)  # Fill the width and ensure it is centered

        # Search Entry
        self.search_entry = ctk.CTkEntry(search_frame, placeholder_text="Search by Generic Name...", width=250)
        self.search_entry.pack(side=tk.LEFT, padx=10)  # Pack the entry to the left with padding

        # Search Button
        search_button = ctk.CTkButton(search_frame, text="Search", command=self.search, height=30, width=120)
        search_button.pack(side=tk.LEFT, padx=10, pady=10)  # Pack the button to the left with padding


        # Table frame
        table_frame = tk.Frame(self.frame)
        table_frame.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)

        # Set a custom font size
        custom_font = ("Arial", 15)  # You can adjust the size (12) to make the font larger or smaller

        # Table with custom scrollbars
        self.table = ttk.Treeview(table_frame, columns=("ID", "Generic Name", "Information", "Usage", "Complication", "Warning"), show="headings", selectmode="browse")
        self.table.heading("ID", text="ID")
        self.table.heading("Generic Name", text="Generic Name")
        self.table.heading("Information", text="Information")
        self.table.heading("Usage", text="Usage")
        self.table.heading("Complication", text="Complication")
        self.table.heading("Warning", text="Warning")
        self.table.column("ID", width=30)

        # Apply the font to the entire table
        self.table.tag_configure("custom", font=custom_font)

        # Apply font to headings as well
        self.table.heading("ID", text="ID", anchor="center", command=lambda: self.sort_column("ID"))
        self.table.heading("Generic Name", text="Generic Name", anchor="center")
        self.table.heading("Information", text="Information", anchor="center")
        self.table.heading("Usage", text="Usage", anchor="center")
        self.table.heading("Complication", text="Complication", anchor="center")
        self.table.heading("Warning", text="Warning", anchor="center")

        # Pack table into frame
        self.table.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)


        # Vertical scrollbar
        vscroll = ttk.Scrollbar(table_frame, orient="vertical", command=self.table.yview)
        vscroll.pack(side=tk.RIGHT, fill="y")
        self.table.configure(yscrollcommand=vscroll.set)

        # Buttons
        button_frame = ctk.CTkFrame(self.frame, fg_color="#091d28", corner_radius=10)  # Set corner radius here
        button_frame.pack(pady=10, padx=20, fill=tk.Y)


        # Add button
        add_button = ctk.CTkButton(button_frame, text="Add", command=self.add_popup, height=30, width=120,
                                fg_color="#4CAF50", hover_color="#45a049", text_color="white")  # Green color
        add_button.pack(side=tk.LEFT, padx=10, pady=10)

        # Edit button
        edit_button = ctk.CTkButton(button_frame, text="Edit", command=self.edit_popup, height=30, width=120,
                                    fg_color="#2196F3", hover_color="#1976D2", text_color="white")  # Blue color
        edit_button.pack(side=tk.LEFT, padx=10, pady=10)

        # Delete button
        delete_button = ctk.CTkButton(button_frame, text="Delete", command=self.delete_row, height=30, width=120,
                                    fg_color="#F44336", hover_color="#E53935", text_color="white")  # Red color
        delete_button.pack(side=tk.LEFT, padx=10, pady=10)

        # Load data
        self.load_data()

        # Bind the table selection event
        self.table.bind("<ButtonRelease-1>", self.on_row_select)

    def execute_db(self, query, params=()):
        conn = sqlite3.connect(r'D:\EJIE SCHOOLING\CLASSES\5th year\Thesis\Scanseta_Collab\Scanseta\Back_end\medicine_infos.db')
        c = conn.cursor()
        c.execute(query, params)
        conn.commit()
        conn.close()

    def load_data(self):
        for item in self.table.get_children():
            self.table.delete(item)
        conn = sqlite3.connect(r'D:\EJIE SCHOOLING\CLASSES\5th year\Thesis\Scanseta_Collab\Scanseta\Back_end\medicine_infos.db')
        c = conn.cursor()
        c.execute("SELECT * FROM medicines")
        rows = c.fetchall()
        for row in rows:
            self.table.insert("", "end", values=row)
        conn.close()

    def add_popup(self):
        self.show_popup("Add Medicine", self.add_row)

    def edit_popup(self):
        if hasattr(self, "selected_row") and self.selected_row:  # Ensure a row is selected
            # Pass the selected row data to show_popup for editing
            self.show_popup("Edit Medicine", self.update_row, self.selected_row)
        else:
            messagebox.showerror("Error", "No row selected!")

    def show_popup(self, title, action, data=None):
        # Create the popup window
        popup = ctk.CTkToplevel(self.root)
        popup.title(title)

        # Set the size of the popup
        popup.geometry("500x500")

        # Calculate the position to center the popup on the screen
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        window_width = 500
        window_height = 685

        # Calculate the x and y position to center the window
        x = (screen_width // 2) - (window_width // 2)
        y = (screen_height // 2) - (window_height // 2)

        # Set the position of the popup
        popup.geometry(f"{window_width}x{window_height}+{x}+{y}")

        # Popup container
        popup_frame = ctk.CTkFrame(popup)
        popup_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create entry fields (using Textbox instead of Entry for multi-line text)
        entries = {}
        fields = ["Generic Name", "Information", "Usage", "Complication", "Warning"]
        for field in fields:
            # Create a centered label above the entry
            label = ctk.CTkLabel(popup_frame, text=field)
            label.pack(pady=5, anchor="center")

            # Use CTkTextbox instead of CTkEntry
            textbox = ctk.CTkTextbox(popup_frame, width=300, height=70)
            textbox.pack(pady=5)

            # Store the textbox in the entries dictionary
            entries[field] = textbox

        # Pre-fill the entries if `data` is provided
        if data:
            for idx, field in enumerate(fields):
                entries[field].insert("0.0", data[idx + 1])

        # Action Button
        def handle_action():
            inputs = {field: entry.get("0.0", tk.END).strip() for field, entry in entries.items()}
            if all(inputs.values()):
                action(inputs, popup)
            else:
                messagebox.showerror("Error", "All fields must be filled!")

        submit_button = ctk.CTkButton(popup_frame, text="Submit", command=handle_action, height=40, width=120)
        submit_button.pack(pady=10)




    def add_row(self, inputs, popup):
        query = '''
            INSERT INTO medicines (generic_name, information, usage, complication, warning)
            VALUES (?, ?, ?, ?, ?)
        '''
        self.execute_db(query, tuple(inputs.values()))
        self.load_data()
        popup.destroy()

    def update_row(self, inputs, popup):
        query = '''
            UPDATE medicines
            SET generic_name = ?, information = ?, usage = ?, complication = ?, warning = ?
            WHERE id = ?
        '''
        self.execute_db(query, tuple(inputs.values()) + (self.selected_row[0],))
        self.load_data()
        popup.destroy()

    def delete_row(self):
        if hasattr(self, "selected_row") and self.selected_row:
            confirm = messagebox.askyesno("Confirm", "Are you sure you want to delete this row?")
            if confirm:
                query = "DELETE FROM medicines WHERE id = ?"
                self.execute_db(query, (self.selected_row[0],))
                self.load_data()
        else:
            messagebox.showerror("Error", "No row selected!")

    def on_row_select(self, event):
        selected_item = self.table.selection()
        if selected_item:
            self.selected_row = self.table.item(selected_item)["values"]
        else:
            self.selected_row = None

    def search(self):
        keyword = self.search_entry.get().strip()
        for item in self.table.get_children():
            self.table.delete(item)
        conn = sqlite3.connect(r'D:\EJIE SCHOOLING\CLASSES\5th year\Thesis\Scanseta_Collab\Scanseta\Back_end\medicine_infos.db')

        c = conn.cursor()
        c.execute("SELECT * FROM medicines WHERE generic_name LIKE ?", (f"%{keyword}%",))
        rows = c.fetchall()
        for row in rows:
            self.table.insert("", "end", values=row)
        conn.close()


if __name__ == "__main__":
    root = ctk.CTk()
    app = ManagementApp(root)
    root.mainloop()
