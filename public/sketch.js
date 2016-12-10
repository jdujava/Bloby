var game = {};

	//When loading, we store references to our
	//drawing canvases, and initiate a game instance.
setup(){

		//Create our game client instance.
	game = new game_core();
    createCanvas(1000,800);

			//Fetch the viewport
		game.viewport = document.getElementById('defaultCanvas0');

			//Adjust their size
		game.viewport.width = game.world.width;
		game.viewport.height = game.world.height;

		//Finally, start the loop
	game.update( new Date().getTime() );

}
