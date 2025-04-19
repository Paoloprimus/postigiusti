import os
import json

def create_project_structure():
    # Definizione delle directory
    directories = [
        'components',
        'pages',
        'pages/api',
        'lib',
        'styles',
        'public'
    ]
    
    # Definizione dei file
    files = {
        'pages/_app.tsx': '// File di inizializzazione principale dell\'app Next.js',
        'pages/index.tsx': '// Homepage del progetto',
        'pages/login.tsx': '// Pagina di login',
        'pages/signup.tsx': '// Pagina di registrazione tramite invito',
        'pages/dashboard.tsx': '// Dashboard utente',
        'pages/generate-invite.tsx': '// Pagina per generazione inviti',
        'lib/supabase.ts': '// Client Supabase per interazione con il database',
        'lib/types.ts': '// Definizione delle interfacce TypeScript',
        'middleware.ts': '// Middleware per la gestione dell\'autenticazione',
        'next.config.js': 'module.exports = {\n  reactStrictMode: true,\n};',
        'package.json': json.dumps({
            "name": "next-supabase-invite-project",
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": {
                "next": "^13.0.0",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "@supabase/supabase-js": "^2.0.0",
                "typescript": "^4.8.4"
            },
            "devDependencies": {
                "@types/node": "^18.11.0",
                "@types/react": "^18.0.21",
                "eslint": "^8.25.0",
                "eslint-config-next": "^13.0.0"
            }
        }, indent=2)
    }

    # Creazione delle directory
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Creata directory: {directory}")
        except Exception as e:
            print(f"❌ Errore nella creazione della directory {directory}: {e}")

    # Creazione dei file
    for file_path, content in files.items():
        try:
            # Assicuriamo che la directory del file esista
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                
            # Creazione del file
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✅ Creato file: {file_path}")
        except Exception as e:
            print(f"❌ Errore nella creazione del file {file_path}: {e}")

    print("\n🎉 Struttura del progetto creata con successo!")
    print("\nPer iniziare il progetto, esegui:")
    print("  npm install  # o yarn")
    print("  npm run dev  # o yarn dev")

if __name__ == "__main__":
    create_project_structure()