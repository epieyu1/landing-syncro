module.exports = {
    apps: [
        {
            name: "Syncro-Backend",
            script: "./venv/bin/uvicorn",
            args: "app.main:app --host 0.0.0.0 --port 8000 --reload",
            cwd: "./backend",
            interpreter: "none", // Usamos el binario uvicorn directamente
            autorestart: true,
            watch: true,
            ignore_watch: ["./app.db", "./app.db-journal", "./sent_history", "./__pycache__", "./venv"],
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "Syncro-Frontend",
            script: "npm",
            args: "run dev",
            cwd: "./frontend",
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: "development",
            }
        }
    ]
};
