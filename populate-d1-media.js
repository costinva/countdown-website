const fs = require('fs');
const path = require('path');

const DATABASE_DIR = 'full_archive'; // <--- Confirm this matches your folder name
const OUTPUT_DIR = 'd1_sql_batches';
const ITEMS_PER_SQL_BATCH = 15000;

async function generateD1InsertSqlFiles() {
    console.log(`Generating D1 insert SQL files from '${DATABASE_DIR}' into '${OUTPUT_DIR}'...`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const files = fs.readdirSync(DATABASE_DIR)
                    .filter(file => file.endsWith('.json') && file.includes('-'));

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
            
            // Safely get score, converting to a number
            const itemScore = (item.score !== undefined && item.score !== null && !isNaN(parseFloat(item.score)))
                            ? parseFloat(item.score)
                            : null;

            // Safely get backdrops, ensure it's an array, then JSON.stringify
            const itemBackdrops = Array.isArray(item.backdrops) && item.backdrops.length > 0
                                 ? JSON.stringify(item.backdrops)
                                 : null;
            // Safely get screenshots, ensure it's an array, then JSON.stringify
            const itemScreenshots = Array.isArray(item.screenshots) && item.screenshots.length > 0
                                 ? JSON.stringify(item.screenshots)
                                 : null;
            
            // Safely get systemRequirements (might be HTML string)
            const itemSystemRequirements = item.systemRequirements || null;

            const sql = `INSERT OR IGNORE INTO media (id, type, title, releaseDate, posterImage, overview, genres, score, backdrops, screenshots, systemRequirements) VALUES ('${
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
            }, ${
                itemScore !== null ? itemScore : 'NULL' // Use the parsed score
            }, ${
                itemBackdrops ? `'${String(itemBackdrops).replace(/'/g, "''")}'` : 'NULL'
            }, ${
                itemScreenshots ? `'${String(itemScreenshots).replace(/'/g, "''")}'` : 'NULL'
            }, ${
                itemSystemRequirements ? `'${String(itemSystemRequirements).replace(/'/g, "''")}'` : 'NULL'
            });`;

            currentSqlCommands.push(sql);
            totalItemsProcessed++;

            if (currentSqlCommands.length >= ITEMS_PER_SQL_BATCH) {
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