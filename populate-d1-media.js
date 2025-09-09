const fs = require('fs');
const path = require('path');

// IMPORTANT: This script will generate multiple .sql files into a new folder.
// You will then execute them one by one using `wrangler d1 execute`.

const DATABASE_DIR = 'database'; // <--- Confirm this matches your folder name (e.g., 'database' or 'full_archive')
const OUTPUT_DIR = 'd1_sql_batches'; // Folder to save the SQL files
const ITEMS_PER_SQL_BATCH = 15000; // <--- INCREASED: Number of items per SQL file.

async function generateD1InsertSqlFiles() {
    console.log(`Generating D1 insert SQL files from '${DATABASE_DIR}' into '${OUTPUT_DIR}'...`);

    // Create the output directory if it doesn't exist
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const files = fs.readdirSync(DATABASE_DIR)
                    .filter(file => file.endsWith('.json') && file.includes('-')); // Ensures it's an item detail file

    let currentSqlCommands = [];
    let batchFileIndex = 1;
    let totalItemsProcessed = 0;

    for (const file of files) {
        const filePath = path.join(DATABASE_DIR, file);
        let item;
        try {
            item = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (parseError) {
            console.warn(`Skipping file due to parse error: ${file}, Error: ${parseError.message}`);
            continue;
        }

        if (item && item.id && item.type && item.title) {
            const itemGenres = Array.isArray(item.genres) && item.genres.length > 0
                             ? item.genres.join(', ')
                             : null;

            const sql = `INSERT OR IGNORE INTO media (id, type, title, releaseDate, posterImage, overview, genres) VALUES ('${
                String(item.id).replace(/'/g, "''")
            }', '${
                String(item.type).replace(/'/g, "''")
            }', '${
                String(item.title).replace(/'/g, "''")
            }', ${
                item.releaseDate ? `'${String(item.releaseDate).replace(/'/g, "''")}'` : 'NULL'
            }, ${
                item.posterImage ? `'${String(item.posterImage).replace(/'/g, "''")}'` : 'NULL'
            }, ${
                item.overview ? `'${String(item.overview).replace(/'/g, "''")}'` : 'NULL'
            }, ${
                itemGenres ? `'${String(itemGenres).replace(/'/g, "''")}'` : 'NULL'
            });`;

            currentSqlCommands.push(sql);
            totalItemsProcessed++;

            if (currentSqlCommands.length >= ITEMS_PER_SQL_BATCH) {
                // Write the current batch to a file in the output directory
                const outputFileName = path.join(OUTPUT_DIR, `d1_media_inserts_part${batchFileIndex}.sql`);
                fs.writeFileSync(outputFileName, currentSqlCommands.join('\n') + '\n');
                console.log(`Generated ${outputFileName} with ${currentSqlCommands.length} items.`);
                
                currentSqlCommands = [];
                batchFileIndex++;
            }
        } else {
            console.warn(`Skipping malformed or incomplete item in file: ${file}`);
        }
    }

    // Write any remaining items to the last file
    if (currentSqlCommands.length > 0) {
        const outputFileName = path.join(OUTPUT_DIR, `d1_media_inserts_part${batchFileIndex}.sql`);
        fs.writeFileSync(outputFileName, currentSqlCommands.join('\n') + '\n');
        console.log(`Generated ${outputFileName} with ${currentSqlCommands.length} items.`);
    }

    console.log(`\n--- Generation Complete ---`);
    console.log(`Total items processed: ${totalItemsProcessed}`);
    console.log(`You will find the generated SQL files in the '${OUTPUT_DIR}' folder.`);
    console.log(`\n--- Next Steps ---`);
    console.log(`1. Ensure your D1 database schema is correct (media, comments, users tables).`);
    console.log(`2. Execute all generated files against your D1 database:`);
    console.log(`   Get-ChildItem -Path ${OUTPUT_DIR} -Filter *.sql | ForEach-Object { wrangler d1 execute <YOUR_DATABASE_NAME> --file $_.FullName --remote }`);
    console.log(`   (Remember to replace <YOUR_DATABASE_NAME> with 'countdown-db')`);
}

generateD1InsertSqlFiles();