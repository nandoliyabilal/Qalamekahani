const supabase = require('./config/supabase');

async function debugStory(title) {
    console.log(`Searching for story: ${title}`);
    const { data: story, error } = await supabase.from('stories').select('id, title').ilike('title', `%${title}%`).single();

    if (error || !story) {
        console.error('Story not found:', error ? error.message : 'No match');
        return;
    }

    console.log('Story ID:', story.id);

    // Check Reviews
    const { count: reviewCount } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('item_id', story.id);
    console.log('Related Reviews:', reviewCount);

    // Check Orders
    const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('story_id', story.id);
    console.log('Related Orders:', orderCount);
}

debugStory('Jinaa Ki Dulhan');
