'use client';

import React, { useState, useEffect } from 'react';

const TelegramPage = () => {
  const [instagram, setInstagram] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingInstagram, setExistingInstagram] = useState('');

  // Carregar Instagram existente quando a página carregar
  useEffect(() => {
    const loadExistingInstagram = async () => {
      try {
        const response = await fetch('/api/instagram-cadastro');
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.instagram) {
            setExistingInstagram(data.data.instagram);
            setInstagram(data.data.instagram);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar Instagram existente:', err);
      }
    };

    loadExistingInstagram();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!instagram.trim()) {
      setError('Por favor, insira seu @ do Instagram');
      return;
    }

    const cleanInstagram = instagram.replace('@', '');
    
    if (cleanInstagram.length < 3) {
      setError('@ do Instagram deve ter pelo menos 3 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/instagram-cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instagram: cleanInstagram
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setExistingInstagram(cleanInstagram);
      } else {
        setError(data.error || 'Erro ao cadastrar. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setError('');
  };

  if (isSubmitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5', 
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            {existingInstagram ? 'Instagram Atualizado!' : 'Cadastro Realizado!'}
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>
            Seu @ do Instagram foi {existingInstagram ? 'atualizado' : 'cadastrado'} com sucesso. Você será adicionado aos Close Friends do Fatos da Bolsa em breve!
          </p>
          
          {/* 📲 TELEGRAM BOT INSTRUCTIONS APÓS SUCESSO */}
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px',
            border: '1px solid #0ea5e9',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0c4a6e',
              marginBottom: '16px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              📲 Agora acesse nosso Telegram!
            </h3>
            <p style={{
              color: '#0c4a6e',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Acesse os canais exclusivos da sua assinatura através do nosso bot:
            </p>
            <a
              href="https://t.me/membroscfbot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                backgroundColor: '#0ea5e9',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 16px 0',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
            >
              🤖 Acessar Bot do Telegram
            </a>
            <p style={{
              color: '#0c4a6e',
              fontSize: '12px',
              textAlign: 'center',
              margin: 0,
              lineHeight: '1.4'
            }}>
              O bot fará a autenticação automática e liberará acesso aos canais da sua assinatura.
            </p>
          </div>

          <button
            onClick={resetForm}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '24px' 
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '48px' 
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 16px 0'
        }}>
          📱📲 Recursos Exclusivos
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: '20px',
          margin: '0',
          maxWidth: '700px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.6'
        }}>
          Configure seu acesso aos conteúdos exclusivos do Instagram e Telegram
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 📱 SEÇÃO INSTAGRAM */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📱 Instagram Close Friends
          </h2>
          
          {/* Mostrar Instagram atual se existir */}
          {existingInstagram && (
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #10b981'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#065f46',
                marginBottom: '8px'
              }}>
                ✅ Instagram Cadastrado:
              </h4>
              <p style={{
                color: '#065f46',
                fontSize: '16px',
                margin: 0,
                fontWeight: '600'
              }}>
                @{existingInstagram}
              </p>
              <p style={{
                color: '#065f46',
                fontSize: '14px',
                margin: '8px 0 0 0'
              }}>
                Você pode atualizar seu @ abaixo se necessário.
              </p>
            </div>
          )}

          {/* Info sobre Close Friends */}
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '32px',
            border: '1px solid #0ea5e9'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0c4a6e',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⭐ O que é Close Friends?
            </h3>
            <p style={{
              color: '#0c4a6e',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.5'
            }}>
              Close Friends é uma função do Instagram que permite compartilhar Stories exclusivos apenas para uma lista selecionada de pessoas. 
              Você receberá conteúdos especiais, análises em primeira mão e insights exclusivos do mercado financeiro.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {existingInstagram ? 'Atualizar @ do Instagram:' : 'Seu @ do Instagram:'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  @
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    setError('');
                  }}
                  placeholder="seunome"
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 40px',
                    fontSize: '16px',
                    border: error ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    if (!error) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }
                  }}
                  onBlur={(e) => {
                    if (!error) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                  maxLength={30}
                />
              </div>
              {error && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                  {error}
                </p>
              )}
              <p style={{
                color: '#64748b',
                fontSize: '12px',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                Digite apenas o nome de usuário, sem o @
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: isLoading ? '#94a3b8' : '#374151',
                color: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  {existingInstagram ? 'Atualizando...' : 'Cadastrando...'}
                </>
              ) : (
                <>
                  📱 {existingInstagram ? 'Atualizar Instagram' : 'Cadastrar no Close Friends'}
                </>
              )}
            </button>
          </form>

          {/* Informações adicionais */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #f59e0b'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#92400e',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚡ Importante:
            </h4>
            <ul style={{
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0,
              paddingLeft: '20px'
            }}>
              <li style={{ marginBottom: '8px' }}>A adição pode levar até <strong>48 horas</strong> para ser processada</li>
              <li style={{ marginBottom: '8px' }}>Você receberá conteúdos <strong>exclusivos</strong> nos Stories</li>
              <li>Caso não seja adicionado, verifique se seu @ está correto</li>
            </ul>
          </div>
        </div>

        {/* 📲 SEÇÃO TELEGRAM */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📲 Acesso ao Telegram
          </h2>

          {/* Card principal do Telegram */}
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #0ea5e9'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0c4a6e',
                marginBottom: '12px'
              }}>
                Bot Fatos da Bolsa
              </h3>
              <p style={{
                color: '#0c4a6e',
                fontSize: '16px',
                margin: '0',
                lineHeight: '1.5'
              }}>
                Acesse os canais exclusivos da sua assinatura através do nosso bot automatizado.
              </p>
            </div>

            <a
              href="https://t.me/membroscfbot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                backgroundColor: '#0ea5e9',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '20px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0ea5e9';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.3)';
              }}
            >
              🚀 Acessar Bot do Telegram
            </a>
          </div>

          {/* Passo a passo */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Como acessar:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  1
                </div>
                <div>
                  <p style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Clique no botão acima
                  </p>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Isso abrirá o Telegram e levará você diretamente ao nosso bot.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  2
                </div>
                <div>
                  <p style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Inicie a conversa
                  </p>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Digite <strong>/start</strong> para iniciar a conversa com o bot.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  3
                </div>
                <div>
                  <p style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Faça a autenticação
                  </p>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    O bot verificará automaticamente sua assinatura e liberará o acesso.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  ✓
                </div>
                <div>
                  <p style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Acesse os canais
                  </p>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Você terá acesso aos canais exclusivos da sua assinatura!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações importantes */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #f59e0b'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#92400e',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 Dica importante:
            </h4>
            <ul style={{
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0,
              paddingLeft: '20px'
            }}>
              <li style={{ marginBottom: '8px' }}>Você receberá acesso aos canais <strong>específicos da sua assinatura</strong></li>
              <li>Em caso de problemas, entre em contato conosco</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSS para animação de loading */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TelegramPage;
