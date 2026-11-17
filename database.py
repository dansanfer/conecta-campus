from sqlmodel import SQLModel, create_engine, Session

# Cria um arquivo de banco local chamado database.db (fácil de testar)
sqlite_url = "sqlite:///database.db"
engine = create_engine(sqlite_url, echo=True)

def criar_banco():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session