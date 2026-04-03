const supabase = require('./config/supabase');

async function checkBooksColumns() {
    console.log("Checking 'books' table columns...");

    const { data, error } = await supabase
        .from('books')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching books:", error.message);
        return;
    }

    if (data && data.length > 0) {
        const book = data[0];
        console.log("Keys in fetched book:", Object.keys(book));
        const required = ['title', 'author', 'original_price', 'discounted_price', 'category', 'buy_link', 'language', 'image', 'description', 'stock', 'status'];
        required.forEach(key => {
            if (key in book) {
                console.log(`SUCCESS: '${key}' column EXISTS.`);
            } else {
                console.log(`FAILURE: '${key}' column is MISSING.`);
            }
        });
    } else {
        console.log("No books found to check schema. Attempting dry-run insert...");
        const { error: insertError } = await supabase
            .from('books')
            .insert([{ title: 'Check', original_price: 10, buy_link: 'http', language: 'Eng' }])
            .select();

        if (insertError) {
            console.log("FAILURE: Column likely missing based on error:", insertError.message);
        } else {
            console.log("Insert check SUCCESS: columns seem to exist.");
        }
    }
}

checkBooksColumns();
