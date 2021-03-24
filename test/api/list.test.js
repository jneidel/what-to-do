const express = require( "express" );
const bodyParser = require( "body-parser" );
const request = require( "supertest" );

global.console = {
  error: jest.fn(),
};

const DBresolvedReq = ( data = {} ) => jest.fn( () => Promise.resolve( data ) );
const DBrejectedReq  = err => jest.fn( () => Promise.reject( err ) );

let app, ListMock;

beforeEach( () => {
  app = express();
  app.use( bodyParser.json() );
  app.use( bodyParser.urlencoded( { extended: true } ) );

  TodoMock = {
    findAll: DBresolvedReq(),
  };
  ListMock = {
    findAll: DBresolvedReq(),
    update : DBresolvedReq(),
    destroy: DBresolvedReq(),
    create : DBresolvedReq(),
  };
  app.use( ( req, res, next ) => {
    req.models = { List: ListMock, Todo: TodoMock };
    next();
  } );
  app.use( "/api", require( "../../routes/api" ) );
  app.use( "/api", require( "../../routes/apiErrorHandler" ) );
} );

describe( "GET /api/lists", () => {
  test( "success", async () => {
    const lists = [ { id: "123", name: "list", color: "#00ff00" } ];
    const todos = [ { id: "456", text: "todo", done: false } ];
    ListMock.findAll = DBresolvedReq( lists );
    TodoMock.findAll = DBresolvedReq( todos );

    const res = await request( app )
      .get( "/api/lists" );

    expect( res.status ).toBe( 200 );
    expect( res.body ).toEqual( { error: false, lists, todos } );
  } );
  test( "no existing list", async () => {
    const lists = [ { id: "123", name: "default", color: "#000000" } ];
    ListMock.findAll = DBresolvedReq( [] );
    ListMock.create = DBresolvedReq( lists[0] );

    const res = await request( app )
      .get( "/api/lists" );

    expect( res.status ).toBe( 200 );
    expect( res.body ).toEqual( { error: false, lists, todos: [] } );
  } );
} );

describe( "POST /api/list", () => {
  test( "success", async () => {
    const name = "main-list";
    const color = "#ff0000";

    const res = await request( app )
      .post( "/api/list" )
      .send( { name, color } );

    expect( res.status ).toBe( 200 );
    expect( res.body.error ).toBeFalsy();
  } );

  test( "wrong color format", async () => {
    const color = "#333";

    const res = await request( app )
      .post( "/api/list" )
      .send( { name: "123", color } );

    expect( res.status ).toBe( 400 );
    expect( res.body.error ).toBeTruthy();
    expect( res.body.errorMsg ).toBe( "invalid hex color (#rrggbb)" );
  } );
} );

describe( "PUT /api/list", () => {
  test( "update color & name", async () => {
    const data = { name: "123", color: "#00ff00", newName: "321" };

    const res = await request( app )
      .put( "/api/list" )
      .send( data );

    expect( res.status ).toBe( 200 );
    expect( res.body.error ).toBeFalsy();
    expect( ListMock.update.mock.calls[0][0].color ).toBe( data.color );
    expect( ListMock.update.mock.calls[0][0].name ).toBe( data.newName );
  } );
  test( "wrong color format", async () => {
    const color = "#333";

    const res = await request( app )
      .put( "/api/list" )
      .send( { name: "123", color } );

    expect( res.status ).toBe( 400 );
    expect( res.body.error ).toBeTruthy();
    expect( res.body.errorMsg ).toBe( "invalid hex color (#rrggbb)" );
  } );
  test( "send nothing", async () => {
    const res = await request( app )
      .put( "/api/list" )
      .send( { name: "213" } );

    expect( res.status ).toBe( 400 );
    expect( res.body.error ).toBeTruthy();
    expect( res.body.errorMsg ).toBe( "nothing to update" );
  } );
} );

describe( "DELETE /api/todo", () => {
  test( "success", async () => {
    const data = { name: "123" };

    const res = await request( app )
      .delete( "/api/list" )
      .send( data );

    expect( res.status ).toBe( 200 );
    expect( res.body.error ).toBeFalsy();
  } );
} );